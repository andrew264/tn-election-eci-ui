import asyncio
import concurrent.futures
import urllib.parse
from contextlib import asynccontextmanager
from datetime import datetime

import uvicorn
from bs4 import BeautifulSoup
from curl_cffi import requests
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

BASE_URL = "https://results.eci.gov.in/ResultAcGenMay2026/"
MAIN_URL = urllib.parse.urljoin(BASE_URL, "partywiseresult-S22.htm")
INTERVAL = 30


# --- Global State ---
class AppState:
  main_data = {}
  const_data = {}
  logs = []
  last_updated = "Waiting for first fetch..."
  poll_count = 0


state = AppState()


# --- Scraping Logic ---

def fetch_constituencies_for_party(session, link, party_name, status_type):
  full_url = urllib.parse.urljoin(BASE_URL, link)
  try:
    resp = session.get(full_url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    data = {}
    for row in soup.select("table tr"):
      cells = row.find_all("td")
      if len(cells) >= 6:
        const_name = cells[1].get_text(strip=True)
        candidate = cells[2].get_text(strip=True)
        votes = cells[3].get_text(strip=True)
        margin = cells[4].get_text(strip=True)
        status = cells[5].get_text(strip=True)

        if const_name:
          data[const_name] = {
            "party": party_name, "candidate": candidate, "votes": votes, "margin": margin, "status": status, "type": status_type
          }
    return data
  except Exception:
    return {}


def fetch_all_data_sync():
  session = requests.Session(impersonate="chrome124")
  resp = session.get(MAIN_URL, timeout=20)
  resp.raise_for_status()
  soup = BeautifulSoup(resp.text, "html.parser")

  main_data = {}
  fetch_tasks = []

  for row in soup.select("table tr"):
    cells = row.find_all("td")
    if len(cells) >= 4:
      party = cells[0].get_text(strip=True)
      if party and party != "Total":
        won_td = cells[1]
        lead_td = cells[2]
        total_td = cells[3]

        main_data[party] = {
          "won": won_td.get_text(strip=True), "leading": lead_td.get_text(strip=True), "total": total_td.get_text(strip=True),
        }

        a_won = won_td.find("a")
        if a_won:
          fetch_tasks.append((a_won.get("href"), party, "Won"))

        a_lead = lead_td.find("a")
        if a_lead:
          fetch_tasks.append((a_lead.get("href"), party, "Leading"))

  const_data = {}
  with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    future_to_url = {executor.submit(fetch_constituencies_for_party, session, link, p, t): (link, p, t) for link, p, t in fetch_tasks}
    for future in concurrent.futures.as_completed(future_to_url):
      const_data.update(future.result())

  return main_data, const_data


def add_log(event_type, message):
  timestamp = datetime.now().strftime("%H:%M:%S")
  state.logs.insert(0, {"time": timestamp, "type": event_type, "msg": message})
  # Keep only the latest 300 logs to prevent memory bloat
  if len(state.logs) > 300:
    state.logs.pop()


def process_diff(current_main, current_const):
  main_changed = False

  # 1. Main Tally Diff
  for party in set(state.main_data) | set(current_main):
    o = state.main_data.get(party, {"won": "—", "leading": "—", "total": "—"})
    n = current_main.get(party, {"won": "—", "leading": "—", "total": "—"})
    diffs = []
    if o["won"] != n["won"]:         diffs.append(f"Won: {o['won']} → {n['won']}")
    if o["leading"] != n["leading"]: diffs.append(f"Leading: {o['leading']} → {n['leading']}")
    if o["total"] != n["total"]:     diffs.append(f"Total: {o['total']} → {n['total']}")
    if diffs:
      add_log("TALLY", f"{party}: {', '.join(diffs)}")
      main_changed = True

  # 2. Constituency Diff
  for c_name in set(state.const_data) | set(current_const):
    if c_name not in state.const_data:
      n = current_const[c_name]
      add_log("NEW", f"{c_name} is now {n['type']} by {n['party']} ({n['candidate']})")
      continue
    if c_name not in current_const:
      continue

    o = state.const_data[c_name]
    n = current_const[c_name]

    if o['party'] != n['party']:
      add_log("FLIP", f"🔄 FLIP! {c_name}: {o['party']} ({o['candidate']}) ➔ {n['party']} ({n['candidate']})")
    else:
      if o['type'] != n['type']:
        add_log("DECLARATION", f"🏆 DECLARATION: {c_name} - {n['party']} changed from {o['type']} to {n['type']}!")

      sub_diffs = []
      if o['candidate'] != n['candidate']: sub_diffs.append(f"Candidate: {o['candidate']} ➔ {n['candidate']}")
      if o['margin'] != n['margin']:       sub_diffs.append(f"Margin: {o['margin']} ➔ {n['margin']}")
      if o['status'] != n['status']:       sub_diffs.append(f"Status: {o['status']} ➔ {n['status']}")
      if o['votes'] != n['votes']:         sub_diffs.append(f"Votes: {o['votes']} ➔ {n['votes']}")

      if sub_diffs:
        add_log("METRIC", f"{c_name} [{n['party']}]: " + " | ".join(sub_diffs))

  state.main_data = current_main
  state.const_data = current_const


Link


# --- Background Task ---

async def scraper_loop():
  while True:
    try:
      state.poll_count += 1
      print(f"[{datetime.now().strftime('%H:%M:%S')}] Poll #{state.poll_count} fetching...")

      current_main, current_const = await asyncio.to_thread(fetch_all_data_sync)

      if not state.main_data and current_main:
        add_log("SYSTEM", f"Initial snapshot recorded: {len(current_main)} parties, {len(current_const)} active constituencies.")
        state.main_data = current_main
        state.const_data = current_const
      elif current_main:
        process_diff(current_main, current_const)

      state.last_updated = datetime.now().strftime("%I:%M:%S %p")

    except Exception as e:
      add_log("ERROR", f"Fetch failed: {e}")
      print(f"[!] Error: {e}")

    await asyncio.sleep(INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
  # Startup
  task = asyncio.create_task(scraper_loop())
  yield
  # Shutdown
  task.cancel()


app = FastAPI(lifespan=lifespan)


# --- API Endpoints ---

@app.get("/api/state")
def get_state():
  sorted_main = dict(sorted(state.main_data.items(), key=lambda item: int(item[1]['total']) if item[1]['total'].isdigit() else 0, reverse=True))
  return {
    "poll_count": state.poll_count, "last_updated": state.last_updated, "main_data": sorted_main, "const_data": state.const_data, "logs": state.logs
  }


if __name__ == "__main__":
  uvicorn.run(app, host="0.0.0.0", port=8000)
