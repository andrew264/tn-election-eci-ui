import asyncio
import re
import urllib.parse
from contextlib import asynccontextmanager
from datetime import datetime

import uvicorn
from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession
from fastapi import FastAPI

BASE_URL = "https://results.eci.gov.in/ResultAcGenMay2026/"
MAIN_URL = urllib.parse.urljoin(BASE_URL, "partywiseresult-S22.htm")
TOTAL_CONSTITUENCIES = 234
CONCURRENT_WORKERS = 30


# --- Global State ---
class AppState:
  main_data = {}
  const_data = {}
  party_map = {}
  logs = []
  last_updated = "Waiting for first fetch..."
  poll_count = 0


state = AppState()


def add_log(event_type, message):
  timestamp = datetime.now().strftime("%H:%M:%S")
  state.logs.insert(0, {"time": timestamp, "type": event_type, "msg": message})
  if len(state.logs) > 300:
    state.logs.pop()


# --- Parsing Logic ---

async def fetch_main_tally(session: AsyncSession):
  try:
    resp = await session.get(MAIN_URL, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")

    current_main = {}
    for row in soup.select("table tr"):
      cells = row.find_all("td", recursive=False)
      if len(cells) >= 4:
        party_full = cells[0].get_text(strip=True)
        if party_full and party_full != "Total":
          current_main[party_full] = {
            "won": cells[1].get_text(strip=True), "leading": cells[2].get_text(strip=True), "total": cells[3].get_text(strip=True),
          }
          base_name = party_full.split(" - ")[0].strip().lower()
          state.party_map[base_name] = party_full

    # Process Main Diff
    if state.main_data:
      for party in set(state.main_data) | set(current_main):
        o = state.main_data.get(party, {"won": "—", "leading": "—", "total": "—"})
        n = current_main.get(party, {"won": "—", "leading": "—", "total": "—"})
        diffs = []
        if o["won"] != n["won"]:         diffs.append(f"Won: {o['won']} → {n['won']}")
        if o["leading"] != n["leading"]: diffs.append(f"Leading: {o['leading']} → {n['leading']}")
        if o["total"] != n["total"]:     diffs.append(f"Total: {o['total']} → {n['total']}")
        if diffs:
          add_log("TALLY", f"{party}: {', '.join(diffs)}")

    state.main_data = current_main
    state.last_updated = datetime.now().strftime("%I:%M:%S %p")
    state.poll_count += 1
  except Exception as e:
    print(f"[!] Main Tally Error: {e}")


async def fetch_constituency(session: AsyncSession, ac_id: int):
  url = urllib.parse.urljoin(BASE_URL, f"candidateswise-S22{ac_id}.htm")
  try:
    resp = await session.get(url, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract AC Name
    title_tag = soup.select_one(".page-title h2 span")
    if not title_tag:
      return None
    ac_text = title_tag.get_text(strip=True).split("(")[0].strip()
    ac_name = " - ".join(ac_text.split("-")[1:]).strip() if "-" in ac_text else ac_text

    # Extract Rounds
    round_tag = soup.select_one(".round-status")
    current_round, total_rounds = 0, 0
    if round_tag:
      text = round_tag.get_text(separator=" ", strip=True)
      m = re.search(r'(\d+)\s*/\s*(\d+)', text)
      if m:
        current_round, total_rounds = int(m.group(1)), int(m.group(2))
      else:
        nums = re.findall(r'\d+', text)
        if len(nums) >= 2:
          current_round, total_rounds = int(nums[-2]), int(nums[-1])

    # Extract Candidates
    candidates = []
    for box in soup.select(".cand-box"):
      c_name = box.select_one(".nme-prty h5").get_text(strip=True) if box.select_one(".nme-prty h5") else "Unknown"
      c_party_raw = box.select_one(".nme-prty h6").get_text(strip=True) if box.select_one(".nme-prty h6") else "Unknown"

      c_party = state.party_map.get(c_party_raw.lower(), c_party_raw)

      status_tag = box.select_one(".status")
      raw_status = "trailing"
      if status_tag:
        classes = status_tag.get("class", [])
        for s in ["leading", "won", "trailing", "lost"]:
          if s in classes:
            raw_status = s
            break

      vote_div = box.select_one(".status div:nth-of-type(2)")
      votes, margin = 0, 0
      if vote_div:
        v_text = vote_div.contents[0].strip() if vote_div.contents else "0"
        votes = int(re.sub(r'[^\d]', '', v_text) or 0)
        span = vote_div.select_one("span")
        if span:
          m_val = int(re.sub(r'[^\d]', '', span.get_text(strip=True)) or 0)
          margin = m_val if raw_status in ["leading", "won"] else -m_val

      candidates.append({
        "name": c_name, "party": c_party, "votes": votes, "margin_to_leader": margin, "status": raw_status
      })

    candidates.sort(key=lambda x: x["votes"], reverse=True)
    top_cands = candidates[:3]
    nota_cand = next((c for c in candidates if "NOTA" in c["name"].upper() or "NOTA" in c["party"].upper()), None)
    if nota_cand and nota_cand not in top_cands:
      top_cands.append(nota_cand)

    leading = top_cands[0] if top_cands else None
    runner_up = top_cands[1] if len(top_cands) > 1 else None

    # Build payload
    const_obj = {
      "id": ac_id, "name": ac_name, "round": current_round, "total": total_rounds, "status": leading["status"] if leading else "leading",
      "type": "Won" if leading and leading["status"] in ["won", "Declared"] else "Leading", "party": leading["party"] if leading else "Unknown",
      "candidate": leading["name"] if leading else "Unknown", "votes": str(leading["votes"]) if leading else "0",
      "margin": str(abs(leading["margin_to_leader"])) if leading else "0", "runner_up_party": runner_up["party"] if runner_up else "None",
      "runner_up_candidate": runner_up["name"] if runner_up else "None", "candidates": []
    }

    for idx, c in enumerate(candidates):
      if c in top_cands:
        const_obj["candidates"].append({
          "pos": idx + 1, "name": c["name"], "party": c["party"], "votes": c["votes"], "margin_to_leader": c["margin_to_leader"], "status": c["status"]
        })

    return const_obj
  except Exception as e:
    return None


# --- Continuous Processing Engine ---

def process_single_const_diff(n):
  c_name = n["name"]
  o = state.const_data.get(c_name)

  if not o:
    add_log("NEW", f"{c_name} reported: {n['party']} leading.")
    return

  # Flip check
  if o["party"] != n["party"]:
    add_log("FLIP", f"🔄 FLIP! {c_name}: {n['party']} overtook {o['party']}!")

  # Declaration check
  elif o["type"] != n["type"] and n["type"] == "Won":
    add_log("DECLARATION", f"🏆 DECLARATION: {c_name} won by {n['party']}!")

  # Margin Squeeze Check (dropped below 1000 threshold)
  elif int(n["margin"]) < 1000 and int(o["margin"]) >= 1000:
    add_log("SQUEEZE", f"⚠️ TIGHT RACE: {c_name} margin dropped to {n['margin']} ({n['party']} vs {n['runner_up_party']})")

  # Round Update
  elif o["round"] != n["round"]:
    add_log("ROUND", f"⏱️ {c_name}: Round {n['round']}/{n['total']} finished. {n['party']} leads by {n['margin']}.")


async def polling_loop(session: AsyncSession):
  """
  Executes a synchronized polling loop. Fetches all data within a concurrency limit,
  waits for completion, processes all diffs sequentially, and then sleeps for
  the remainder of the 30-second window.
  """
  sem = asyncio.Semaphore(CONCURRENT_WORKERS)

  async def fetch_with_sem(ac_id):
    async with sem:
      return await fetch_constituency(session, ac_id)

  while True:
    start_time = asyncio.get_event_loop().time()

    # 1. Update party map and main tally first
    await fetch_main_tally(session)

    # 2. Gather all new constituency data simultaneously
    tasks = [fetch_with_sem(i) for i in range(1, TOTAL_CONSTITUENCIES + 1)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # 3. Process diffs ONLY once all new data is fetched
    for res in results:
      if isinstance(res, dict) and "name" in res:
        process_single_const_diff(res)
        state.const_data[res["name"]] = res

    # 4. Wait out the remaining time up to 30 seconds
    elapsed = asyncio.get_event_loop().time() - start_time
    sleep_time = max(0.0, 30.0 - elapsed)
    await asyncio.sleep(sleep_time)


@asynccontextmanager
async def lifespan(app: FastAPI):
  session = AsyncSession(impersonate="chrome124")
  poll_task = asyncio.create_task(polling_loop(session))

  yield

  poll_task.cancel()
  await session.close()


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
