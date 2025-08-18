# -*- coding: utf-8 -*-
from app import app

# This is required for Vercel deployment
# Export the Flask app as the default handler
if __name__ == "__main__":
    app.run()
