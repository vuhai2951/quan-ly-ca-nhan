# -*- coding: utf-8 -*-
from app import app

# Export the Flask app for Vercel
def handler(request):
    return app(request.environ, lambda status, headers: None)
