let currentSection = 'players';
let dataCache = { players: [], teams: [], tournaments: [], venues: [], referees: [], registrations: [], matches: [], scores: [] };

const eb = document.getElementById('error-banner');
const ebt = document.getElementById('error-banner-text');
const ebx = document.getElementById('error-banner-close');
const modalOverlay = document.getElementById('modal-overlay');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const btnAddText = document.getElementById('btn-add-text');
const statsRow = document.getElementById('stats-row');
let ebTimer;

const ICONS = {
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V7l7-4 7 4v14"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path><path d="M9 13h.01"></path><path d="M15 13h.01"></path></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"></path><path d="M7 6H5a2 2 0 0 0-2 2c0 2.5 1.5 4 4 4"></path><path d="M17 6h2a2 2 0 0 1 2 2c0 2.5-1.5 4-4 4"></path></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z"></path><circle cx="12" cy="11" r="2.5"></circle></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"></path><path d="M8 7h8"></path><path d="M5 7l-2 4h4l-2-4Z"></path><path d="M19 7l-2 4h4l-2-4Z"></path><path d="M6 11a2 2 0 0 0 2 2"></path><path d="M18 11a2 2 0 0 1-2 2"></path><path d="M8 21h8"></path></svg>',
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"></rect><path d="M9 7h6"></path><path d="M9 11h6"></path><path d="M9 15h4"></path></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path><path d="M8 14h3"></path><path d="M13 14h3"></path></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M7 15l3-3 3 2 4-5"></path></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>'
};

function showError(msg) {
    if (ebTimer) clearTimeout(ebTimer);
    ebt.textContent = msg;
    eb.classList.remove('fade-out');
    eb.classList.add('visible');
    ebTimer = setTimeout(() => {
        eb.classList.add('fade-out');
        setTimeout(() => eb.classList.remove('visible', 'fade-out'), 400);
    }, 5000);
}
ebx.addEventListener('click', () => eb.classList.remove('visible', 'fade-out'));

function esc(str) { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }
function escAttr(str) { return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function fmtDate(iso) {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function toInputDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toISOString().split('T')[0];
}
function initials(name) {
    return String(name || '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() || '')
        .join('') || '--';
}
function avg(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');
        switchSection(e.currentTarget.dataset.section);
    });
});

function switchSection(section) {
    currentSection = section;
    ['players', 'teams', 'tournaments', 'venues', 'referees', 'registrations', 'matches', 'scores'].forEach(sec => {
        const el = document.getElementById(`section-${sec}`);
        if (el) el.classList.add('hidden');
    });
    document.getElementById(`section-${section}`).classList.remove('hidden');

    const headers = {
        players: { t: 'Players', s: 'Manage all registered players' },
        teams: { t: 'Teams', s: 'Manage sports teams' },
        tournaments: { t: 'Tournaments', s: 'Manage events and active tournaments' },
        venues: { t: 'Venues', s: 'Manage locations and stadiums' },
        referees: { t: 'Referees', s: 'Manage official referees' },
        registrations: { t: 'Registrations', s: 'Manage tournament team registrations' },
        matches: { t: 'Matches', s: 'Manage individual matches' },
        scores: { t: 'Scores', s: 'Manage match results' }
    };
    pageTitle.textContent = headers[section].t;
    pageSubtitle.textContent = headers[section].s;
    btnAddText.textContent = `Add ${headers[section].t.slice(0, -1)}`;
    fetchData(section);
}

async function fetchData(section) {
    try {
        const res = await fetch(`/api/${section}`, { cache: 'no-store' });
        if (res.status === 400) { showError((await res.json()).error); return; }
        if (!res.ok) throw new Error('Server Error');

        const data = await res.json();
        dataCache[section] = data;
        await loadDropdownDependencies(section);
        renderTable(section, data);
        renderStats(section, data);
    } catch (err) {
        showError(`Failed to load ${section}. Server unreachable.`);
    }
}

function lookupName(sec, idKey, idVal, nameKey) {
    if (!dataCache[sec] || !idVal) return idVal || 'N/A';
    const item = dataCache[sec].find(entry => String(entry[idKey]) === String(idVal));
    return item ? item[nameKey] : idVal;
}

function actionButtons(section, pk) {
    return `<td class="action-cell">
        <button class="action-btn" type="button" aria-label="Edit" onclick="editRecord('${section}', '${escAttr(pk)}')">${ICONS.edit}</button>
        <button class="action-btn delete" type="button" aria-label="Delete" onclick="deleteRecord('${section}', '${escAttr(pk)}')">${ICONS.trash}</button>
    </td>`;
}

function renderTable(section, data) {
    const tbody = document.getElementById(`tbody-${section}`);
    const empty = document.getElementById(`empty-${section}`);
    const table = document.getElementById(`table-${section}`);
    tbody.innerHTML = '';

    if (data.length === 0) {
        empty.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    empty.style.display = 'none';
    table.style.display = 'table';

    data.forEach(item => {
        const tr = document.createElement('tr');
        let content = '';

        if (section === 'players') {
            content = `
                <td>${esc(item.PLAYER_ID)}</td>
                <td><div class="player-name-cell"><span class="avatar-badge">${esc(initials(item.PLAYER_NAME))}</span><span>${esc(item.PLAYER_NAME)}</span></div></td>
                <td>${esc(item.AGE)}</td>
                <td>${esc(item.GENDER)}</td>
                <td>${esc(item.POSITION)}</td>
                <td>${esc(lookupName('teams', 'TEAM_ID', item.TEAM_ID, 'TEAM_NAME'))}</td>
            `;
        } else if (section === 'teams') {
            content = `
                <td>${esc(item.TEAM_ID)}</td>
                <td>${esc(item.TEAM_NAME)}</td>
                <td>${esc(item.COACH_NAME)}</td>
                <td>${esc(item.CITY)}</td>
                <td>${esc(item.CONTACT_NUMBER)}</td>
            `;
        } else if (section === 'tournaments') {
            content = `
                <td>${esc(item.TOURNAMENT_ID)}</td>
                <td>${esc(item.TOURNAMENT_NAME)}</td>
                <td>${esc(item.SPORT_TYPE)}</td>
                <td>${fmtDate(item.START_DATE)}</td>
                <td>${fmtDate(item.END_DATE)}</td>
                <td>${esc(item.LOCATION)}</td>
                <td>${esc(item.ORGANIZER_NAME)}</td>
            `;
        } else if (section === 'venues') {
            content = `
                <td>${esc(item.VENUE_ID)}</td>
                <td>${esc(item.VENUE_NAME)}</td>
                <td>${esc(item.LOCATION)}</td>
                <td>${esc(item.CAPACITY)}</td>
            `;
        } else if (section === 'referees') {
            content = `
                <td>${esc(item.REFEREE_ID)}</td>
                <td>${esc(item.REFEREE_NAME)}</td>
                <td>${esc(item.EXPERIENCE_YEARS)}</td>
                <td>${esc(item.CONTACT_NUMBER)}</td>
            `;
        } else if (section === 'registrations') {
            content = `
                <td>${esc(item.REGISTRATION_ID)}</td>
                <td>${fmtDate(item.REGISTRATION_DATE)}</td>
                <td>${esc(lookupName('tournaments', 'TOURNAMENT_ID', item.TOURNAMENT_ID, 'TOURNAMENT_NAME'))}</td>
                <td>${esc(lookupName('teams', 'TEAM_ID', item.TEAM_ID, 'TEAM_NAME'))}</td>
            `;
        } else if (section === 'matches') {
            content = `
                <td>${esc(item.MATCH_ID)}</td>
                <td>${esc(lookupName('tournaments', 'TOURNAMENT_ID', item.TOURNAMENT_ID, 'TOURNAMENT_NAME'))}</td>
                <td>${fmtDate(item.MATCH_DATE)}</td>
                <td>${esc(item.MATCH_TIME)}</td>
                <td>${esc(item.MATCH_TYPE)}</td>
                <td>${esc(lookupName('venues', 'VENUE_ID', item.VENUE_ID, 'VENUE_NAME'))}</td>
                <td>${esc(lookupName('referees', 'REFEREE_ID', item.REFEREE_ID, 'REFEREE_NAME'))}</td>
            `;
        } else if (section === 'scores') {
            content = `
                <td>${esc(item.SCORE_ID)}</td>
                <td>${esc(item.MATCH_ID)}</td>
                <td>${esc(lookupName('teams', 'TEAM_ID', item.TEAM_ID, 'TEAM_NAME'))}</td>
                <td>${esc(item.POINTS_SCORED)}</td>
                <td>${esc(item.RESULT_STATUS)}</td>
            `;
        }

        const pk = getPrimaryKey(section, item);
        tr.innerHTML = content + actionButtons(section, pk);
        tbody.appendChild(tr);
    });
}

function statCard(title, value, subtitle, icon) {
    return `<div class="stat-card">
        <div class="stat-card-top">
            <div>
                <div class="stat-card-title">${esc(title)}</div>
                <div class="stat-card-value">${esc(value)}</div>
            </div>
            <div class="stat-card-icon" aria-hidden="true">${icon}</div>
        </div>
        <div class="stat-card-subtitle">${esc(subtitle)}</div>
    </div>`;
}

function renderStats(section, data) {
    statsRow.innerHTML = '';
    if (section === 'players') {
        const teamCount = new Set(data.filter(item => item.TEAM_ID).map(item => item.TEAM_ID)).size;
        const ages = data.map(item => Number(item.AGE)).filter(Number.isFinite);
        statsRow.innerHTML = [
            statCard('Total Players', data.length, `${teamCount} active team allocations`, ICONS.users),
            statCard('Average Age', ages.length ? avg(ages) : 0, `${teamCount} squads represented`, ICONS.team)
        ].join('');
    } else if (section === 'teams') {
        const cities = new Set(data.map(item => item.CITY).filter(Boolean)).size;
        statsRow.innerHTML = statCard('Total Teams', data.length, `${cities} home cities in rotation`, ICONS.team);
    } else if (section === 'tournaments') {
        statsRow.innerHTML = statCard('Total Tournaments', data.length, 'Season calendar overview', ICONS.trophy);
    } else if (section === 'venues') {
        const cap = data.reduce((sum, item) => sum + (parseInt(item.CAPACITY, 10) || 0), 0);
        statsRow.innerHTML = [
            statCard('Total Venues', data.length, 'Facility network available', ICONS.pin),
            statCard('Total Capacity', cap.toLocaleString(), 'Combined spectator footprint', ICONS.chart)
        ].join('');
    } else if (section === 'referees') {
        statsRow.innerHTML = statCard('Total Referees', data.length, 'Match officials on file', ICONS.scale);
    } else if (section === 'registrations') {
        statsRow.innerHTML = statCard('Registrations', data.length, 'Tournament entries submitted', ICONS.clipboard);
    } else if (section === 'matches') {
        statsRow.innerHTML = statCard('Total Matches', data.length, 'Fixtures ready for review', ICONS.calendar);
    } else if (section === 'scores') {
        statsRow.innerHTML = statCard('Score Entries', data.length, 'Result tracking in progress', ICONS.chart);
    }
}

function getPrimaryKey(section, item) {
    if (section === 'players') return item.PLAYER_ID;
    if (section === 'teams') return item.TEAM_ID;
    if (section === 'tournaments') return item.TOURNAMENT_ID;
    if (section === 'venues') return item.VENUE_ID;
    if (section === 'referees') return item.REFEREE_ID;
    if (section === 'registrations') return item.REGISTRATION_ID;
    if (section === 'matches') return item.MATCH_ID;
    if (section === 'scores') return item.SCORE_ID;
}

function filterTables(section) {
    const query = document.getElementById(`search-${section}`).value.toLowerCase().trim();
    if (!query) { renderTable(section, dataCache[section]); return; }
    const filtered = dataCache[section].filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(query)));
    renderTable(section, filtered);
}

async function loadDropdownDependencies(sec) {
    if (sec === 'players') await ensureData('teams');
    if (sec === 'registrations') { await ensureData('tournaments'); await ensureData('teams'); }
    if (sec === 'matches') { await ensureData('tournaments'); await ensureData('venues'); await ensureData('referees'); }
    if (sec === 'scores') { await ensureData('matches'); await ensureData('teams'); }
}

function populateDropdownsForModal(sec) {
    if (sec === 'players') populateSelect('p_team', dataCache.teams, 'TEAM_ID', 'TEAM_NAME');
    else if (sec === 'registrations') {
        populateSelect('reg_tourn', dataCache.tournaments, 'TOURNAMENT_ID', 'TOURNAMENT_NAME');
        populateSelect('reg_team', dataCache.teams, 'TEAM_ID', 'TEAM_NAME');
    } else if (sec === 'matches') {
        populateSelect('m_tourn', dataCache.tournaments, 'TOURNAMENT_ID', 'TOURNAMENT_NAME');
        populateSelect('m_venue', dataCache.venues, 'VENUE_ID', 'VENUE_NAME');
        populateSelect('m_ref', dataCache.referees, 'REFEREE_ID', 'REFEREE_NAME');
    } else if (sec === 'scores') {
        populateSelect('s_match', dataCache.matches, 'MATCH_ID', 'MATCH_ID');
        populateSelect('s_team', dataCache.teams, 'TEAM_ID', 'TEAM_NAME');
    }
}

async function ensureData(sec) {
    if (!dataCache[sec] || dataCache[sec].length === 0) await fetchData(sec);
}

function populateSelect(id, data, valKey, textKey) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = `<option value="">Select</option>${data.map(item => `<option value="${item[valKey]}">${esc(item[textKey] || item[valKey])}</option>`).join('')}`;
    if (currentVal) sel.value = currentVal;
}

window.openModalForActiveSection = async function() {
    ['players', 'teams', 'tournaments', 'venues', 'referees', 'registrations', 'matches', 'scores'].forEach(sec => {
        document.getElementById(`form-${sec}`).classList.add('hidden');
    });
    document.getElementById(`form-${currentSection}`).classList.remove('hidden');
    document.getElementById(`${currentSection}_edit_id`).value = '';
    const primaryInput = document.getElementById(getPrimaryInputId(currentSection));
    if (primaryInput) { primaryInput.readOnly = false; primaryInput.style.opacity = '1'; }
    document.getElementById(`form-${currentSection}`).reset();
    document.getElementById('modal-title').textContent = `Add ${currentSection.slice(0, -1)}`;
    populateDropdownsForModal(currentSection);
    modalOverlay.classList.add('visible');
};

function getPrimaryInputId(sec) {
    if (sec === 'players') return 'p_id';
    if (sec === 'teams') return 't_id';
    if (sec === 'tournaments') return 'tr_id';
    if (sec === 'venues') return 'v_id';
    if (sec === 'referees') return 'ref_id';
    if (sec === 'registrations') return 'reg_id';
    if (sec === 'matches') return 'm_id';
    if (sec === 'scores') return 's_id';
}

function closeModal() { modalOverlay.classList.remove('visible'); }

window.editRecord = async function(section, id) {
    const item = dataCache[section].find(entry => String(getPrimaryKey(section, entry)) === String(id));
    if (!item) return;
    await window.openModalForActiveSection();
    document.getElementById(`${section}_edit_id`).value = id;
    document.getElementById('modal-title').textContent = `Edit ${section.slice(0, -1)}`;

    if (section === 'players') {
        document.getElementById('p_id').value = item.PLAYER_ID; document.getElementById('p_id').readOnly = true; document.getElementById('p_id').style.opacity = '0.5';
        document.getElementById('p_name').value = item.PLAYER_NAME || '';
        document.getElementById('p_age').value = item.AGE || '';
        document.getElementById('p_gender').value = item.GENDER || '';
        document.getElementById('p_pos').value = item.POSITION || '';
        document.getElementById('p_team').value = item.TEAM_ID || '';
    } else if (section === 'teams') {
        document.getElementById('t_id').value = item.TEAM_ID; document.getElementById('t_id').readOnly = true; document.getElementById('t_id').style.opacity = '0.5';
        document.getElementById('t_name').value = item.TEAM_NAME || '';
        document.getElementById('t_coach').value = item.COACH_NAME || '';
        document.getElementById('t_city').value = item.CITY || '';
        document.getElementById('t_contact').value = item.CONTACT_NUMBER || '';
    } else if (section === 'tournaments') {
        document.getElementById('tr_id').value = item.TOURNAMENT_ID; document.getElementById('tr_id').readOnly = true; document.getElementById('tr_id').style.opacity = '0.5';
        document.getElementById('tr_name').value = item.TOURNAMENT_NAME || '';
        document.getElementById('tr_sport').value = item.SPORT_TYPE || '';
        document.getElementById('tr_start').value = toInputDate(item.START_DATE);
        document.getElementById('tr_end').value = toInputDate(item.END_DATE);
        document.getElementById('tr_loc').value = item.LOCATION || '';
        document.getElementById('tr_org').value = item.ORGANIZER_NAME || '';
    } else if (section === 'venues') {
        document.getElementById('v_id').value = item.VENUE_ID; document.getElementById('v_id').readOnly = true; document.getElementById('v_id').style.opacity = '0.5';
        document.getElementById('v_name').value = item.VENUE_NAME || '';
        document.getElementById('v_loc').value = item.LOCATION || '';
        document.getElementById('v_cap').value = item.CAPACITY || '';
    } else if (section === 'referees') {
        document.getElementById('ref_id').value = item.REFEREE_ID; document.getElementById('ref_id').readOnly = true; document.getElementById('ref_id').style.opacity = '0.5';
        document.getElementById('ref_name').value = item.REFEREE_NAME || '';
        document.getElementById('ref_exp').value = item.EXPERIENCE_YEARS || '';
        document.getElementById('ref_contact').value = item.CONTACT_NUMBER || '';
    } else if (section === 'registrations') {
        document.getElementById('reg_id').value = item.REGISTRATION_ID; document.getElementById('reg_id').readOnly = true; document.getElementById('reg_id').style.opacity = '0.5';
        document.getElementById('reg_date').value = toInputDate(item.REGISTRATION_DATE);
        document.getElementById('reg_tourn').value = item.TOURNAMENT_ID || '';
        document.getElementById('reg_team').value = item.TEAM_ID || '';
    } else if (section === 'matches') {
        document.getElementById('m_id').value = item.MATCH_ID; document.getElementById('m_id').readOnly = true; document.getElementById('m_id').style.opacity = '0.5';
        document.getElementById('m_tourn').value = item.TOURNAMENT_ID || '';
        document.getElementById('m_date').value = toInputDate(item.MATCH_DATE);
        document.getElementById('m_time').value = item.MATCH_TIME || '';
        document.getElementById('m_type').value = item.MATCH_TYPE || '';
        document.getElementById('m_venue').value = item.VENUE_ID || '';
        document.getElementById('m_ref').value = item.REFEREE_ID || '';
    } else if (section === 'scores') {
        document.getElementById('s_id').value = item.SCORE_ID; document.getElementById('s_id').readOnly = true; document.getElementById('s_id').style.opacity = '0.5';
        document.getElementById('s_match').value = item.MATCH_ID || '';
        document.getElementById('s_team').value = item.TEAM_ID || '';
        document.getElementById('s_pts').value = item.POINTS_SCORED || 0;
        document.getElementById('s_status').value = item.RESULT_STATUS || 'Won';
    }
};

window.deleteRecord = async function(section, id) {
    if (!confirm(`Delete record ID: ${id} from ${section}?`)) return;
    try {
        const res = await fetch(`/api/${section}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        const json = await res.json();
        if (res.status === 400) { showError(json.error); return; }
        if (!res.ok) throw new Error('Server Error');
        fetchData(section);
    } catch (err) {
        showError(`Network error deleting from ${section}.`);
    }
};

['players', 'teams', 'tournaments', 'venues', 'referees', 'registrations', 'matches', 'scores'].forEach(sec => {
    document.getElementById(`form-${sec}`).addEventListener('submit', async (e) => {
        e.preventDefault();
        const editingId = document.getElementById(`${sec}_edit_id`).value;
        const data = extractFormData(sec);
        const url = editingId ? `/api/${sec}/${encodeURIComponent(editingId)}` : `/api/${sec}`;
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            let json;
            try {
                json = await res.json();
            } catch {
                showError(`Critical Server Error on ${sec}. Check console.`);
                return;
            }
            if (!res.ok) {
                showError(json.error || 'Database error. Check console for details.');
                return;
            }
            closeModal();
            fetchData(sec);
        } catch (err) {
            showError(`Network error saving ${sec}. Is the backend running?`);
        }
    });
});

function extractFormData(sec) {
    if (sec === 'players') return { player_id: document.getElementById('p_id').value.trim(), player_name: document.getElementById('p_name').value.trim(), age: parseInt(document.getElementById('p_age').value, 10), gender: document.getElementById('p_gender').value, position: document.getElementById('p_pos').value.trim(), team_id: document.getElementById('p_team').value.trim() };
    if (sec === 'teams') return { team_id: document.getElementById('t_id').value.trim(), team_name: document.getElementById('t_name').value.trim(), coach_name: document.getElementById('t_coach').value.trim(), city: document.getElementById('t_city').value.trim(), contact_number: document.getElementById('t_contact').value.trim() };
    if (sec === 'tournaments') return { tournament_id: document.getElementById('tr_id').value.trim(), tournament_name: document.getElementById('tr_name').value.trim(), sport_type: document.getElementById('tr_sport').value.trim(), start_date: document.getElementById('tr_start').value, end_date: document.getElementById('tr_end').value, location: document.getElementById('tr_loc').value.trim(), organizer_name: document.getElementById('tr_org').value.trim() };
    if (sec === 'venues') return { venue_id: document.getElementById('v_id').value.trim(), venue_name: document.getElementById('v_name').value.trim(), location: document.getElementById('v_loc').value.trim(), capacity: parseInt(document.getElementById('v_cap').value, 10) };
    if (sec === 'referees') return { referee_id: document.getElementById('ref_id').value.trim(), referee_name: document.getElementById('ref_name').value.trim(), experience_years: parseInt(document.getElementById('ref_exp').value, 10), contact_number: document.getElementById('ref_contact').value.trim() };
    if (sec === 'registrations') return { registration_id: document.getElementById('reg_id').value.trim(), registration_date: document.getElementById('reg_date').value, tournament_id: document.getElementById('reg_tourn').value.trim(), team_id: document.getElementById('reg_team').value.trim() };
    if (sec === 'matches') return { match_id: document.getElementById('m_id').value.trim(), tournament_id: document.getElementById('m_tourn').value.trim(), match_date: document.getElementById('m_date').value, match_time: document.getElementById('m_time').value.trim(), match_type: document.getElementById('m_type').value.trim(), venue_id: document.getElementById('m_venue').value.trim(), referee_id: document.getElementById('m_ref').value.trim() };
    if (sec === 'scores') return { score_id: document.getElementById('s_id').value.trim(), match_id: document.getElementById('s_match').value.trim(), team_id: document.getElementById('s_team').value.trim(), points_scored: parseInt(document.getElementById('s_pts').value, 10), result_status: document.getElementById('s_status').value };
}

switchSection('players');
