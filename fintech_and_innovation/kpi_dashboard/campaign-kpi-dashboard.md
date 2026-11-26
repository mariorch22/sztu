# Campaign KPI Dashboard

Open `index.html` in a browser to view the Campus Account campaign. The dashboard uses plain HTML, CSS, JavaScript and fixed mock JSON. Filtering and calculations run in the browser.

## Campaign overview

The growth team tracks the cost of acquiring a new account holder. Each person's first account opening counts once and is attributed to one channel. The campaign target is **€25 or less per opening**.

**Campus Account · 2–22 November 2026 · All channels**

| Channel | Ad spend | Clicks | Accounts opened | Conversion rate | Cost per opening |
| --- | ---: | ---: | ---: | ---: | ---: |
| Search | €1,440 | 1,250 | 75 | 6.0% | €19.20 |
| Social | €1,560 | 2,250 | 45 | 2.0% | €34.67 |
| **Total** | **€3,000** | **3,500** | **120** | **3.4%** | **€25.00** |

Search acquired 75 of the 120 accounts at €5.80 below target. Social spent €9.67 more per opening than the target.

## Charts and controls

- The cost chart plots each channel on a shared euro scale. A dashed purple line marks the €25 target. Channels appear in ascending order of cost per opening. Select a channel to filter the report.
- The weekly chart shows 30, 40 and 50 openings for the weeks commencing 2, 9 and 16 November. Switch between openings and spend to compare weekly volume and investment. The stacked bars show each channel’s contribution.
- Selecting a week, a channel or both updates the headline metrics, efficiency chart and details table. The weekly chart keeps all weeks visible for comparison and highlights the selected week. Select it again or use Reset filters to clear the selection.
- On small screens the charts stack and the details table scrolls horizontally. Direct labels and visible keyboard focus keep the controls and charts readable.

## Mock data

Each entry in [campaign.json](campaign.json) holds spend, clicks and openings for one channel and one week starting on Monday. The dashboard sums the filtered rows before dividing spend by openings for cost per opening, or openings by clicks for conversion rate. A dash indicates a zero denominator.

When opened directly from disk, the page reads the identical JSON snapshot embedded in `index.html`. Browsers restrict automatic reads of neighbouring local files. When served as static files over HTTP, the page reads `campaign.json`. If the fixture changes, update the embedded snapshot as well.
