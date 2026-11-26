const byId = id => document.getElementById(id);
const weekFilter = byId('week');
const channelFilter = byId('channel');
const number = new Intl.NumberFormat('en-GB');
const date = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'});
let campaign;
let metric = 'openings';

function filterButton(filter, value, className, label) {
  const button = element('button', null, className);
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', String(filter.value === value));
  button.onclick = () => {
    filter.value = filter.value === value ? '' : value;
    render();
    filter.focus();
  };
  return button;
}

function money(value, digits = 2) {
  if (value == null) return '–';
  return value.toLocaleString('en-GB', {style: 'currency', currency: campaign.currency,
    minimumFractionDigits: digits, maximumFractionDigits: digits});
}

function total(rows) {
  const result = {spend: 0, clicks: 0, openings: 0};
  for (const row of rows) {
    for (const key of ['spend', 'clicks', 'openings']) result[key] += row[key];
  }
  result.cost = result.openings ? result.spend / result.openings : null;
  result.rate = result.clicks ? (result.openings / result.clicks).toLocaleString('en-GB',
    {style: 'percent', minimumFractionDigits: 1}) : '–';
  return result;
}

function groups(rows, key) {
  const buckets = new Map();
  for (const row of rows) {
    if (!buckets.has(row[key])) buckets.set(row[key], []);
    buckets.get(row[key]).push(row);
  }
  return Array.from(buckets, ([name, entries]) => ({name, ...total(entries)}));
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function costChart(channels) {
  const chart = byId('costChart');
  const target = campaign.targetCostPerOpening;
  const max = Math.max(target * 2, ...channels.map(row => row.cost || 0), 1);
  chart.replaceChildren();
  chart.style.setProperty('--target', (100 * target / max) + '%');
  const scale = element('div', null, 'scale');
  const axis = element('div', null, 'axis');
  axis.append(element('span', 'Target ' + money(target, 0)));
  scale.append(axis);
  chart.append(scale);
  for (const channel of channels) {
    const row = filterButton(channelFilter, channel.name, 'cost-row', channel.name + ', ' + money(channel.cost) + ' per opening');
    const track = element('div', null, 'track');
    if (channel.cost != null) {
      track.style.setProperty('--value', (100 * channel.cost / max) + '%');
      track.append(element('i', null, 'dot'));
    }
    row.append(element('span', channel.name), track, element('strong', money(channel.cost)));
    chart.append(row);
  }
  const end = element('div', null, 'scale');
  const ticks = element('div', null, 'ticks');
  ticks.append(element('span', money(0, 0)), element('span', money(max, 0)));
  end.append(ticks);
  chart.append(end);
}

function weekChart(rows) {
  const chart = byId('weekChart');
  const weeks = groups(rows, 'weekStart').sort((a, b) => a.name.localeCompare(b.name));
  const channels = [...new Set(rows.map(row => row.channel))].sort();
  const palette = ['#7353d5', '#41cdb0'];
  const allChannels = Array.from(channelFilter.options).slice(1).map(option => option.value);
  const colour = name => palette[allChannels.indexOf(name) % palette.length];
  const format = value => metric === 'spend' ? money(value, 0) : number.format(value);
  const max = Math.max(1, ...weeks.map(week => week[metric]));
  chart.replaceChildren();
  for (const week of weeks) {
    const label = date.format(new Date(week.name));
    const parts = groups(rows.filter(row => row.weekStart === week.name), 'channel')
      .sort((a, b) => a.name.localeCompare(b.name));
    const breakdown = parts.map(part => part.name + ' ' + format(part[metric])).join(' · ');
    const item = filterButton(weekFilter, week.name, 'week', label + ', ' + metric + ': ' + breakdown);
    item.title = breakdown;
    const column = element('span', null, 'column');
    const stack = element('span', null, 'stack');
    stack.style.height = (104 * week[metric] / max) + 'px';
    for (const part of parts) {
      const segment = element('i');
      segment.style.flexGrow = part[metric];
      segment.style.background = colour(part.name);
      stack.append(segment);
    }
    column.append(element('strong', format(week[metric])), stack);
    item.append(column, element('span', label));
    chart.append(item);
  }
  const legend = byId('legend');
  legend.replaceChildren();
  for (const name of channels) {
    const key = element('span', name);
    key.style.setProperty('--key', colour(name));
    legend.append(key);
  }
}

function tableRow(label, data) {
  const row = element('tr');
  const heading = element('th', label);
  heading.scope = 'row';
  row.append(heading);
  for (const value of [money(data.spend, 0), number.format(data.clicks),
    number.format(data.openings), data.rate, money(data.cost)]) row.append(element('td', value));
  return row;
}

function render() {
  const rows = campaign.weekly.filter(row =>
    (!weekFilter.value || row.weekStart === weekFilter.value) &&
    (!channelFilter.value || row.channel === channelFilter.value));
  byId('report').hidden = !rows.length;
  byId('reset').hidden = !weekFilter.value && !channelFilter.value;
  byId('status').hidden = Boolean(rows.length);
  if (!rows.length) {
    byId('period').textContent = '';
    byId('status').textContent = 'No data for this selection.';
    return;
  }
  const weeks = groups(rows, 'weekStart').sort((a,b) => a.name.localeCompare(b.name));
  const channels = groups(rows, 'channel').sort((a,b) => (a.cost ?? Infinity) - (b.cost ?? Infinity));
  const data = total(rows);
  const end = new Date(weeks.at(-1).name);
  end.setUTCDate(end.getUTCDate() + 6);
  byId('period').textContent = date.format(new Date(weeks[0].name)) + ' – ' +
    end.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
  byId('spend').textContent = money(data.spend, 0);
  byId('clicks').textContent = number.format(data.clicks) + ' clicks';
  byId('openings').textContent = number.format(data.openings);
  byId('conversion').textContent = data.rate + ' conversion rate';
  byId('cost').textContent = money(data.cost);
  byId('goal').textContent = 'Target ≤ ' + money(campaign.targetCostPerOpening, 0);
  costChart(channels);
  weekChart(campaign.weekly.filter(row => !channelFilter.value || row.channel === channelFilter.value));
  const best = channels[0];
  const gap = best.cost == null ? null : best.cost - campaign.targetCostPerOpening;
  byId('insight').textContent = gap == null ? 'No account openings recorded.' :
    gap === 0 ? best.name + ' meets the target exactly.' :
    best.name + ' is ' + money(Math.abs(gap)) + (gap < 0 ? ' below' : ' above') + ' target per opening.';
  document.querySelector('tbody').replaceChildren(...channels.map(row => tableRow(row.name, row)));
  document.querySelector('tfoot').replaceChildren(tableRow('Total', data));
}

async function init() {
  try {
    if (location.protocol === 'file:') {
      campaign = JSON.parse(byId('offline-data').textContent);
    } else {
      const response = await fetch('campaign.json');
      if (!response.ok) throw new Error('Unable to load campaign.json');
      campaign = await response.json();
    }
    byId('campaign').textContent = campaign.campaign;
    for (const week of [...new Set(campaign.weekly.map(row => row.weekStart))].sort()) {
      weekFilter.add(new Option('Week of ' + date.format(new Date(week)), week));
    }
    for (const channel of [...new Set(campaign.weekly.map(row => row.channel))].sort()) {
      channelFilter.add(new Option(channel, channel));
    }
    for (const button of document.querySelectorAll('[data-metric]')) {
      button.onclick = () => {
        metric = button.dataset.metric;
        for (const choice of document.querySelectorAll('[data-metric]')) {
          choice.setAttribute('aria-pressed', String(choice === button));
        }
        render();
      };
    }
    weekFilter.onchange = channelFilter.onchange = render;
    byId('reset').onclick = () => {
      weekFilter.value = channelFilter.value = '';
      render();
    };
    render();
  } catch {
    byId('report').hidden = true;
    byId('status').hidden = false;
    byId('status').textContent = 'Campaign data could not be loaded. Check the mock JSON data.';
  }
}
init();
