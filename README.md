# AI-Virtual-assistant
import speech_recognition as sr
import pyttsx3
import openai
import cv2
import datetime

# OpenAI API Key (Replace with your actual API key)
openai.api_key = "your_api_key_here"

# Initialize text-to-speech engine
engine = pyttsx3.init()

def speak(text):
    """Convert text to speech."""
    engine.say(text)
    engine.runAndWait()

def listen():
    """Listen for user voice input and convert it to text."""
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)
    
    try:
        command = recognizer.recognize_google(audio)
        print(f"You said: {command}")
        return command.lower()
    except sr.UnknownValueError:
        print("Sorry, I could not understand.")
        return ""
    except sr.RequestError:
        print("Could not request results. Check your internet connection.")
        return ""

def chat_with_ai(prompt):
    """Send user input to OpenAI GPT and return response."""
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response['choices'][0]['message']['content']

def take_snapshot():
    """Capture an image using the webcam and save it."""
    cap = cv2.VideoCapture(0)  # Open default webcam
    if not cap.isOpened():
        print("Error: Could not open camera.")
        speak("Sorry, I couldn't access the camera.")
        return
    
    ret, frame = cap.read()  # Capture frame
    if ret:
        filename = f"snapshot_{datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.png"
        cv2.imwrite(filename, frame)
        print(f"Snapshot saved as {filename}")
        speak("Snapshot taken successfully.")
    else:
        print("Error: Could not capture image.")
        speak("Failed to capture an image.")
    
    cap.release()
    cv2.destroyAllWindows()

def assistant():
    """Main assistant function to handle commands."""
    speak("Hello! How can I assist you?")
    while True:
        command = listen()
        
        if "exit" in command or "stop" in command:
            speak("Goodbye!")
            break
        elif "take a picture" in command or "capture image" in command:
            speak("Capturing image now.")
            take_snapshot()
        elif command:
            response = chat_with_ai(command)
            print("AI:", response)
            speak(response)

# Run the virtual assistant
assistant()
