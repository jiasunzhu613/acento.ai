import whisper

def transcription(audio_path): 
    model = whisper.load_model("base")

    result = model.transcribe(audio_path)

    return result["text"]




