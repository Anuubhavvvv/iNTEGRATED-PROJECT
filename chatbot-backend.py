from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import requests
from bs4 import BeautifulSoup
from fuzzywuzzy import fuzz, process
import datetime
import cohere

app = Flask(__name__)
CORS(app)

# Initialize Cohere client
co = cohere.Client("fBslIu8yudKtgCmrYo3vZS0x5CkmvZBIQabyGTny")

# Load the dataset
df = pd.read_csv('manual_data_entry.csv')

# Knowledge Base for greetings and basic questions
knowledge_base = {
    "hello": "Hi there! How can I assist you today?",
    "hi": "Hello! What can I do for you?",
    "hey": "Hey! How can I help you?",
    "how are you": "I'm an AI, so I don't have feelings, but thanks for asking!",
    "what is your name": "I'm your Ultimate Computer Science Chatbot.",
    "what is the date": f"Today's date is {datetime.datetime.now().strftime('%Y-%m-%d')}.",
    "what is the time": f"The current time is {datetime.datetime.now().strftime('%H:%M:%S')}."
}

def fetch_answer_from_csv(query):
    best_match = process.extractOne(query, df['heading'], scorer=fuzz.token_set_ratio)
    if best_match and best_match[1] >= 80:
        return df[df['heading'] == best_match[0]]['data'].values[0]
    return None

def fetch_answer_from_web(query):
    websites = [
        "https://en.wikipedia.org/wiki/Special:Search",
        "https://www.geeksforgeeks.org/search/",
        "https://www.w3schools.com/search",
        "https://stackoverflow.com/search?q="
    ]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.3'}
    
    for site in websites:
        try:
            search_url = f'{site}{query}'
            response = requests.get(search_url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            result = ""
            for item in soup.find_all('h3'):
                link = item.find_parent('a')
                if link:
                    result = f"{item.get_text()}: {link['href']}"
                    break
            if result:
                article_url = link['href']
                article_response = requests.get(article_url)
                article_soup = BeautifulSoup(article_response.text, 'html.parser')
                summary = ' '.join(p.get_text() for p in article_soup.find_all('p')[:5])
                return f"Here's what I found: {summary}"
        except:
            continue
    return "Sorry, I couldn't find anything on the web either."

def fetch_answer_from_cohere(query):
    response = co.generate(
        model="command-xlarge-nightly",
        prompt=query,
        max_tokens=3000,
        temperature=0.9,
        stop_sequences=["\n"]
    )
    return response.generations[0].text.strip()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    query = data['message']
    
    # Process the query
    if query.lower() in knowledge_base:
        answer = knowledge_base[query.lower()]
    else:
        answer = fetch_answer_from_csv(query)
        if not answer:
            answer = fetch_answer_from_web(query)
        if "Sorry, I couldn't find anything on the web either." in answer:
            answer = fetch_answer_from_cohere(query)
    
    return jsonify({'response': answer})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
