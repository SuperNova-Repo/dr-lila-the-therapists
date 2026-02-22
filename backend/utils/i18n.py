translations = {
    "de": {
        "welcome": "Willkommen bei Dr. Lila",
        "login": "Anmelden",
        "register": "Registrieren",
        "logout": "Abmelden",
        "settings": "Einstellungen",
        "profile": "Profil",
        "chat": "Chat",
        "new_chat": "Neuer Chat",
        "delete_chat": "Chat löschen",
        "delete_message": "Nachricht löschen",
        "regenerate": "Neu generieren",
        "send": "Senden",
        "type_message": "Nachricht eingeben..."
    },
    "en": {
        "welcome": "Welcome to Dr. Lila",
        "login": "Login",
        "register": "Register",
        "logout": "Logout",
        "settings": "Settings",
        "profile": "Profile",
        "chat": "Chat",
        "new_chat": "New Chat",
        "delete_chat": "Delete Chat",
        "delete_message": "Delete Message",
        "regenerate": "Regenerate",
        "send": "Send",
        "type_message": "Type a message..."
    }
}

def get_translation(key: str, language: str = "de") -> str:
    """Get translation for key"""
    return translations.get(language, {}).get(key, key)