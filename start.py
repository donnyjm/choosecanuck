import os, sys, subprocess

# Start server in background
subprocess.Popen(
    [sys.executable, "-m", "http.server", "7100", "--directory", "/Users/itsallgood/Documents/kimi/workspace/north-supply/app/public"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
    start_new_session=True
)
print("Server started at http://localhost:7100/")
print("Press Ctrl+C to stop")
