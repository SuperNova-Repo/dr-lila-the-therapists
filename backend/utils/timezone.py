from datetime import datetime
import pytz

def get_user_time(timezone: str = "UTC") -> dict:
    """Get current date and time for user timezone"""
    try:
        tz = pytz.timezone(timezone)
    except:
        tz = pytz.UTC
    
    now = datetime.now(tz)
    
    return {
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "datetime": now.isoformat(),
        "timezone": timezone
    }

def get_available_timezones():
    """Get list of common timezones"""
    return [
        "Europe/Berlin",
        "Europe/London",
        "Europe/Paris",
        "America/New_York",
        "America/Los_Angeles",
        "Asia/Tokyo",
        "Australia/Sydney",
        "UTC"
    ]