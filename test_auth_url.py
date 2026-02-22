import requests
import re
import urllib.parse
from bs4 import BeautifulSoup

try:
    r = requests.get('https://www.careergini.com/api/profile/auth/google', allow_redirects=False)
    loc = r.headers.get('Location', '')
    if loc:
        parsed = urllib.parse.urlparse(loc)
        qs = urllib.parse.parse_qs(parsed.query)
        print(f"Server generated redirect URI: {qs.get('redirect_uri', ['None'])[0]}")
    else:
        print(f"No redirect location found. Status: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")
