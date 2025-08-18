# -*- coding: utf-8 -*-
"""
Entry point cho Vercel deployment
"""
from app import app

# Export app cho Vercel
app_instance = app

if __name__ == "__main__":
    app.run(debug=False)
