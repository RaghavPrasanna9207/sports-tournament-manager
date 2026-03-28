/**
 * main.js — SPA Logic for Players, Teams, Tournaments, and Venues
 * Handles navigation, layout toggling, fetch APIs, stats, and XSS.
 */

// ── GLOBAL STATE ────────────────────────────────────────────────────────
let currentSection = 'players';
let dataCache = { players: [], teams: [], tournaments: [], venues: [], referees: [], registrations: [], matches: [], scores: [] };

// ── DOM ELEMENTS ────────────────────────────────────────────────────────
const eb = document.getElementById('error-banner');
const ebt = document.getElementById('error-banner-text');
const ebx = document.getElementById('error-banner-close');
let ebTimer;

const modalOverlay = document.getElementById('modal-overlay');
const pageTitle    = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const btnAddText   = document.getElementById('btn-add-text');
const statsRow     = document.getElementById('stats-row');

// ── ERROR BANNER LOGIC ──────────────────────────────────────────────────
function showError(msg) {
    if (ebTimer) clearTimeout(ebTimer);
    ebt.textContent = msg;
    eb.classList.remove('fade-out'); eb.classList.add('visible');
    ebTimer = setTimeout(() => {
        eb.classList.add('fade-out');
        setTimeout(() => eb.classList.remove('visible', 'fade-out'), 500);
    }, 5000);
}
ebx.addEventListener('click', () => eb.classList.remove('visible', 'fade-out'));

// ── UTILITIES ───────────────────────────────────────────────────────────
function esc(str) { const d = document.createElement("div"); d.textContent = str ?? ""; return d.innerHTML; }
function escAttr(str) { return String(str ?? "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function toInputDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toISOString().split("T")[0];
}

// ── NAVIGATION LOGIC ────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        switchSection(e.currentTarget.dataset.section);
    });
});

function switchSection(section) {
    currentSection = section;

    // Toggle main sections
    ['players', 'teams', 'tournaments', 'venues', 'referees', 'registrations', 'matches', 'scores'].forEach(sec => {
        const el = document.getElementById(`section-${sec}`);
        if(el) el.classList.add('hidden');
    });
    document.getElementById(`section-${section}`).classList.remove('hidden');

    // Update Header
    const headers = {
        players:     { t: "Players", s: "Manage all registered players" },
        teams:       { t: "Teams", s: "Manage sports teams" },
        tournaments: { t: "Tournaments", s: "Manage events and active tournaments" },
        venues:      { t: "Venues", s: "Manage locations and stadiums" },
        referees:    { t: "Referees", s: "Manage official referees" },
        registrations:{ t: "Registrations", s: "Manage tournament team registrations" },
        matches:     { t: "Matches", s: "Manage individual matches" },
        scores:      { t: "Scores", s: "Manage match results" }
    };
    pageTitle.textContent = headers[section].t;
    pageSubtitle.textContent = headers[section].s;
    btnAddText.textContent = `Add ${headers[section].t.slice(0,-1)}`;

    // Refresh Data
    fetchData(section);
}

// ── API FETCH ROUTER ────────────────────────────────────────────────────
async function fetchData(section) {
    try {
        const res = await fetch(`/api/${section}`, { cache: "no-store" });
        if(res.status === 400) { showError((await res.json()).error); return; }
        if(!res.ok) throw new Error("Server Error");

        const data = await res.json();
        dataCache[section] = data;

        await loadDropdownDependencies(section); // Ensure dependencies exist for table logic

        renderTable(section, data);
        renderStats(section, data);
    } catch(err) {
        showError(`Failed to load ${section}. Server unreachable.`);
    }
}

// ── TABLE RENDERING & LOOKUPS ──────────────────────────────────────────
function lookupName(sec, idKey, idVal, nameKey) {
    if (!dataCache[sec] || !idVal) return idVal || "—";
    const item = dataCache[sec].find(i => String(i[idKey]) === String(idVal));
    return item ? item[nameKey] : idVal;
}

function renderTable(section, data) {
    const tbody = document.getElementById(`tbody-${section}`);
    const empty = document.getElementById(`empty-${section}`);
    const table = document.getElementById(`table-${section}`);
    tbody.innerHTML = "";

    if(data.length === 0) {
        empty.style.display = "block"; table.style.display = "none"; return;
    }
    empty.style.display = "none"; table.style.display = "table";

    data.forEach(item => {
        const tr = document.createElement("tr");

        if(section === 'players') {
            tr.innerHTML = `
                <td>${esc(item.PLAYER_ID)}</td><td>${esc(item.PLAYER_NAME)}</td><td>${esc(item.AGE)}</td>
                <td>${esc(item.GENDER)}</td><td>${esc(item.POSITION)}</td><td>${esc(lookupName('teams', 'TEAM_ID', item.TEAM_ID, 'TEAM_NAME'))}</td>
            `;
        } else if(section === 'teams') {
            tr.innerHTML = `
                <td>${esc(item.TEAM_ID)}</td><td>${esc(item.TEAM_NAME)}</td>
                <td>${esc(item.COACH_NAME)}</td><td>${esc(item.CITY)}</td><td>${esc(item.CONTACT_NUMBER)}</td>
            `;
        } else if(section === 'tournaments') {
            tr.innerHTML = `
                <td>${esc(item.TOURNAMENT_ID)}</td><td>${esc(item.TOURNAMENT_NAME)}</td>
                <td>${esc(item.SPORT_TYPE)}</td><td>${fmtDate(item.START_DATE)}</td><td>${fmtDate(item.END_DATE)}</td>
                <td>${esc(item.LOCATION)}</td><td>${esc(item.ORGANIZER_NAME)}</td>
            `;
        } else if(section === 'venues') {
            tr.innerHTML = `
                <td>${esc(item.VENUE_ID)}</td><td>${esc(item.VENUE_NAME)}</td>
                <td>${esc(item.LOCATION)}</td><td>${esc(item.CAPACITY)}</td>
            `;
        } else if(section === 'referees') {
            tr.innerHTML = `
                <td>${esc(item.REFEREE_ID)}</td><td>${esc(item.REFEREE_NAME)}</td>
                <td>${esc(item.EXPERIENCE_YEARS)}</td><td>${esc(item.CONTACT_NUMBER)}</td>
            `;
        } else if(section === 'registrations') {
            tr.innerHTML = `
                <td>${esc(item.REGISTRATION_ID)}</td><td>${fmtDate(item.REGISTRATION_DATE)}</td>
                <td>${esc(lookupName('tournaments', 'TOURNAMENT_ID', item.TOURNAMENT_ID, 'TOURNAMENT_NAME'))}</td>
                <td>${esc(lookupName('teams', 'TEAM_ID', item.TEAM_ID, 'TEAM_NAME'))}</td>
            `;
        } else if(section === 'matches') {
            tr.innerHTML = `
                <td>${esc(item.MATCH_ID)}</td>
                <td>${esc(lookupName('tournaments', 'TOURNAMENT_ID', item.TOURNAMENT_ID, 'TOURNAMENT_NAME'))}</td>
                <td>${fmtDate(item.MATCH_DATE)}</td><td>${esc(item.MATCH_TIME)}</td><td>${esc(item.MATCH_TYPE)}</td>
                <td>${esc(lookupName('venues', 'VENUE_ID', item.VENUE_ID, 'VENUE_NAME'))}</td>
                <td>${esc(lookupName('referees', 'REFEREE_ID', item.REFEREE_ID, 'REFEREE_NAME'))}</td>
            `;
        } else if(section === 'scores') {
            tr.innerHTML = `
                <td>${esc(item.SCORE_ID)}</td><td>${esc(item.MATCH_ID)}</td>
                <td>${esc(lookupName('teams', 'TEAM_ID', item.TEAM_ID, 'TEAM_NAME'))}</td>
                <td>${esc(item.POINTS_SCORED)}</td><td>${esc(item.RESULT_STATUS)}</td>
            `;
        }

        // Action Buttons
        const pk = getPrimaryKey(section, item);
        tr.innerHTML += `
            <td class="action-cell">
                <button class="btn btn-edit" onclick="editRecord('${section}', '${escAttr(pk)}')">✏️ Edit</button>
                <button class="btn btn-danger" onclick="deleteRecord('${section}', '${escAttr(pk)}')">🗑️ Del</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function getPrimaryKey(section, item) {
    if(section === 'players') return item.PLAYER_ID;
    if(section === 'teams') return item.TEAM_ID;
    if(section === 'tournaments') return item.TOURNAMENT_ID;
    if(section === 'venues') return item.VENUE_ID;
    if(section === 'referees') return item.REFEREE_ID;
    if(section === 'registrations') return item.REGISTRATION_ID;
    if(section === 'matches') return item.MATCH_ID;
    if(section === 'scores') return item.SCORE_ID;
}

// ── SEARCH FILTER ───────────────────────────────────────────────────────
function filterTables(section) {
    const query = document.getElementById(`search-${section}`).value.toLowerCase().trim();
    if(!query) { renderTable(section, dataCache[section]); return; }

    const filtered = dataCache[section].filter(item => {
        return Object.values(item).some(val => String(val).toLowerCase().includes(query));
    });
    renderTable(section, filtered);
}

// ── STATS CARDS ─────────────────────────────────────────────────────────
function renderStats(section, data) {
    statsRow.innerHTML = "";
    if(section === 'players') {
        const t = data.length;
        const ut = new Set(data.filter(d=>d.TEAM_ID).map(d=>d.TEAM_ID)).size;
        statsRow.innerHTML = `
            <div class="stat-card"><div class="stat-card-title">Total Players</div><div class="stat-card-value">${t}</div></div>
            <div class="stat-card"><div class="stat-card-title">Unique Teams</div><div class="stat-card-value">${ut}</div></div>
        `;
    } else if(section === 'teams') {
        statsRow.innerHTML = `
            <div class="stat-card"><div class="stat-card-title">Total Teams</div><div class="stat-card-value">${data.length}</div></div>
        `;
    } else if(section === 'tournaments') {
        statsRow.innerHTML = `
            <div class="stat-card"><div class="stat-card-title">Total Tournaments</div><div class="stat-card-value">${data.length}</div></div>
        `;
    } else if(section === 'venues') {
        const cap = data.reduce((sum, v) => sum + (parseInt(v.CAPACITY)||0), 0);
        statsRow.innerHTML = `
            <div class="stat-card"><div class="stat-card-title">Total Venues</div><div class="stat-card-value">${data.length}</div></div>
            <div class="stat-card"><div class="stat-card-title">Total Capacity</div><div class="stat-card-value">${cap.toLocaleString()}</div></div>
        `;
    } else if(section === 'referees') {
        statsRow.innerHTML = `<div class="stat-card"><div class="stat-card-title">Total Referees</div><div class="stat-card-value">${data.length}</div></div>`;
    } else if(section === 'registrations') {
        statsRow.innerHTML = `<div class="stat-card"><div class="stat-card-title">Total Registrations</div><div class="stat-card-value">${data.length}</div></div>`;
    } else if(section === 'matches') {
        statsRow.innerHTML = `<div class="stat-card"><div class="stat-card-title">Total Matches</div><div class="stat-card-value">${data.length}</div></div>`;
    } else if(section === 'scores') {
        statsRow.innerHTML = `<div class="stat-card"><div class="stat-card-title">Total Scores</div><div class="stat-card-value">${data.length}</div></div>`;
    }
}

// ── MODAL LOGIC ─────────────────────────────────────────────────────────

async function loadDropdownDependencies(sec) {
    if (sec === 'players') await ensureData('teams');
    if (sec === 'registrations') { await ensureData('tournaments'); await ensureData('teams'); }
    if (sec === 'matches') { await ensureData('tournaments'); await ensureData('venues'); await ensureData('referees'); }
    if (sec === 'scores') { await ensureData('matches'); await ensureData('teams'); }
}

function populateDropdownsForModal(sec) {
    if (sec === 'players') {
        populateSelect('p_team', dataCache.teams, 'TEAM_ID', 'TEAM_NAME');
    } else if (sec === 'registrations') {
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
    if (!dataCache[sec] || dataCache[sec].length === 0) {
        await fetchData(sec);
    }
}

function populateSelect(id, data, valKey, textKey) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = `<option value="">Select</option>` + data.map(d => `<option value="${d[valKey]}">${esc(d[textKey] || d[valKey])}</option>`).join('');
    if (currentVal) sel.value = currentVal;
}

window.openModalForActiveSection = async function() {
    // Hide all forms within modal
    ['players','teams','tournaments','venues','referees','registrations','matches','scores'].forEach(s => {
        document.getElementById(`form-${s}`).classList.add('hidden');
    });
    document.getElementById(`form-${currentSection}`).classList.remove('hidden');

    document.getElementById(`${currentSection}_edit_id`).value = "";
    const primaryInput = document.getElementById(getPrimaryInputId(currentSection));
    if(primaryInput) { primaryInput.readOnly = false; primaryInput.style.opacity = "1"; }
    document.getElementById(`form-${currentSection}`).reset();
    document.getElementById('modal-title').textContent = `Add ${currentSection.slice(0,-1)}`;
    // Dependencies are already loaded by fetchData, just populate
    populateDropdownsForModal(currentSection);

    modalOverlay.classList.add('visible');
}

function getPrimaryInputId(sec) {
    if(sec==='players') return 'p_id'; if(sec==='teams') return 't_id';
    if(sec==='tournaments') return 'tr_id'; if(sec==='venues') return 'v_id';
    if(sec==='referees') return 'ref_id'; if(sec==='registrations') return 'reg_id';
    if(sec==='matches') return 'm_id'; if(sec==='scores') return 's_id';
}

function closeModal() { modalOverlay.classList.remove('visible'); }

// ── EDIT RECORD ─────────────────────────────────────────────────────────
window.editRecord = async function(section, id) {
    const item = dataCache[section].find(i => String(getPrimaryKey(section, i)) === String(id));
    if(!item) return;

    await window.openModalForActiveSection(); // prepares base state
    document.getElementById(`${section}_edit_id`).value = id;
    document.getElementById('modal-title').textContent = `Edit ${section.slice(0,-1)}`;

    if(section === 'players') {
        document.getElementById('p_id').value = item.PLAYER_ID; document.getElementById('p_id').readOnly = true; document.getElementById('p_id').style.opacity = "0.5";
        document.getElementById('p_name').value = item.PLAYER_NAME || "";
        document.getElementById('p_age').value = item.AGE || "";
        document.getElementById('p_gender').value = item.GENDER || "";
        document.getElementById('p_pos').value = item.POSITION || "";
        document.getElementById('p_team').value = item.TEAM_ID || "";
    } else if (section === 'teams') {
        document.getElementById('t_id').value = item.TEAM_ID; document.getElementById('t_id').readOnly = true; document.getElementById('t_id').style.opacity = "0.5";
        document.getElementById('t_name').value = item.TEAM_NAME || "";
        document.getElementById('t_coach').value = item.COACH_NAME || "";
        document.getElementById('t_city').value = item.CITY || "";
        document.getElementById('t_contact').value = item.CONTACT_NUMBER || "";
    } else if (section === 'tournaments') {
        document.getElementById('tr_id').value = item.TOURNAMENT_ID; document.getElementById('tr_id').readOnly = true; document.getElementById('tr_id').style.opacity = "0.5";
        document.getElementById('tr_name').value = item.TOURNAMENT_NAME || "";
        document.getElementById('tr_sport').value = item.SPORT_TYPE || "";
        document.getElementById('tr_start').value = toInputDate(item.START_DATE);
        document.getElementById('tr_end').value = toInputDate(item.END_DATE);
        document.getElementById('tr_loc').value = item.LOCATION || "";
        document.getElementById('tr_org').value = item.ORGANIZER_NAME || "";
    } else if (section === 'venues') {
        document.getElementById('v_id').value = item.VENUE_ID; document.getElementById('v_id').readOnly = true; document.getElementById('v_id').style.opacity = "0.5";
        document.getElementById('v_name').value = item.VENUE_NAME || "";
        document.getElementById('v_loc').value = item.LOCATION || "";
        document.getElementById('v_cap').value = item.CAPACITY || "";
    } else if (section === 'referees') {
        document.getElementById('ref_id').value = item.REFEREE_ID; document.getElementById('ref_id').readOnly = true; document.getElementById('ref_id').style.opacity = "0.5";
        document.getElementById('ref_name').value = item.REFEREE_NAME || "";
        document.getElementById('ref_exp').value = item.EXPERIENCE_YEARS || "";
        document.getElementById('ref_contact').value = item.CONTACT_NUMBER || "";
    } else if (section === 'registrations') {
        document.getElementById('reg_id').value = item.REGISTRATION_ID; document.getElementById('reg_id').readOnly = true; document.getElementById('reg_id').style.opacity = "0.5";
        document.getElementById('reg_date').value = toInputDate(item.REGISTRATION_DATE);
        document.getElementById('reg_tourn').value = item.TOURNAMENT_ID || "";
        document.getElementById('reg_team').value = item.TEAM_ID || "";
    } else if (section === 'matches') {
        document.getElementById('m_id').value = item.MATCH_ID; document.getElementById('m_id').readOnly = true; document.getElementById('m_id').style.opacity = "0.5";
        document.getElementById('m_tourn').value = item.TOURNAMENT_ID || "";
        document.getElementById('m_date').value = toInputDate(item.MATCH_DATE);
        document.getElementById('m_time').value = item.MATCH_TIME || "";
        document.getElementById('m_type').value = item.MATCH_TYPE || "";
        document.getElementById('m_venue').value = item.VENUE_ID || "";
        document.getElementById('m_ref').value = item.REFEREE_ID || "";
    } else if (section === 'scores') {
        document.getElementById('s_id').value = item.SCORE_ID; document.getElementById('s_id').readOnly = true; document.getElementById('s_id').style.opacity = "0.5";
        document.getElementById('s_match').value = item.MATCH_ID || "";
        document.getElementById('s_team').value = item.TEAM_ID || "";
        document.getElementById('s_pts').value = item.POINTS_SCORED || 0;
        document.getElementById('s_status').value = item.RESULT_STATUS || "Won";
    }
}

// ── DELETE RECORD ───────────────────────────────────────────────────────
window.deleteRecord = async function(section, id) {
    if(!confirm(`Delete record ID: ${id} from ${section}?`)) return;
    try {
        const res = await fetch(`/api/${section}/${encodeURIComponent(id)}`, { method: "DELETE" });
        const json = await res.json();
        if(res.status === 400) { showError(json.error); return; }
        if(!res.ok) throw new Error("Server Error");
        fetchData(section);
    } catch(err) {
        showError(`Network error deleting from ${section}.`);
    }
}

// ── FORM SUBMISSIONS ────────────────────────────────────────────────────
// Attach a handler for each form dynamically
// ── FORM SUBMISSIONS ────────────────────────────────────────────────────
// Attach a handler for each form dynamically
;['players', 'teams', 'tournaments', 'venues', 'referees', 'registrations', 'matches', 'scores'].forEach(sec => {
    document.getElementById(`form-${sec}`).addEventListener('submit', async (e) => {
        e.preventDefault();
        const editingId = document.getElementById(`${sec}_edit_id`).value;
        const data = extractFormData(sec);
        const url = editingId ? `/api/${sec}/${encodeURIComponent(editingId)}` : `/api/${sec}`;
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify(data)
            });

            // 1. Safely attempt to parse the response
            let json;
            try {
                json = await res.json();
            } catch (parseErr) {
                // If Flask throws an uncaught Python Exception, it returns an HTML page, which breaks res.json()
                console.error("Server returned a non-JSON response. Check your Flask terminal for a Python crash stack trace.");
                showError(`Critical Server Error on ${sec}. Check console.`);
                return;
            }

            // 2. Handle ALL HTTP error codes (400, 409, 500) and expose the database error
            if (!res.ok) {
                console.error(`Backend Database Rejection [${res.status}]:`, json);
                // Display the actual database error to the UI
                showError(json.error || `Database error. Check console for details.`);
                return;
            }

            // 3. Success state
            closeModal();
            fetchData(sec);

        } catch(err) {
            // This now only catches actual network failures (e.g., server offline)
            console.error("Network Fetch Error:", err);
            showError(`Network error saving ${sec}. Is the backend running?`);
        }
    });
});

function extractFormData(sec) {
    if(sec==='players') return {
        player_id: document.getElementById('p_id').value.trim(),
        player_name: document.getElementById('p_name').value.trim(),
        age: parseInt(document.getElementById('p_age').value, 10),
        gender: document.getElementById('p_gender').value,
        position: document.getElementById('p_pos').value.trim(),
        team_id: document.getElementById('p_team').value.trim()
    };
    if(sec==='teams') return {
        team_id: document.getElementById('t_id').value.trim(),
        team_name: document.getElementById('t_name').value.trim(),
        coach_name: document.getElementById('t_coach').value.trim(),
        city: document.getElementById('t_city').value.trim(),
        contact_number: document.getElementById('t_contact').value.trim()
    };
    if(sec==='tournaments') return {
        tournament_id: document.getElementById('tr_id').value.trim(),
        tournament_name: document.getElementById('tr_name').value.trim(),
        sport_type: document.getElementById('tr_sport').value.trim(),
        start_date: document.getElementById('tr_start').value,
        end_date: document.getElementById('tr_end').value,
        location: document.getElementById('tr_loc').value.trim(),
        organizer_name: document.getElementById('tr_org').value.trim()
    };
    if(sec==='venues') return {
        venue_id: document.getElementById('v_id').value.trim(),
        venue_name: document.getElementById('v_name').value.trim(),
        location: document.getElementById('v_loc').value.trim(),
        capacity: parseInt(document.getElementById('v_cap').value, 10)
    };
    if(sec==='referees') return {
        referee_id: document.getElementById('ref_id').value.trim(),
        referee_name: document.getElementById('ref_name').value.trim(),
        experience_years: parseInt(document.getElementById('ref_exp').value, 10),
        contact_number: document.getElementById('ref_contact').value.trim()
    };
    if(sec==='registrations') return {
        registration_id: document.getElementById('reg_id').value.trim(),
        registration_date: document.getElementById('reg_date').value,
        tournament_id: document.getElementById('reg_tourn').value.trim(),
        team_id: document.getElementById('reg_team').value.trim()
    };
    if(sec==='matches') return {
        match_id: document.getElementById('m_id').value.trim(),
        tournament_id: document.getElementById('m_tourn').value.trim(),
        match_date: document.getElementById('m_date').value,
        match_time: document.getElementById('m_time').value.trim(),
        match_type: document.getElementById('m_type').value.trim(),
        venue_id: document.getElementById('m_venue').value.trim(),
        referee_id: document.getElementById('m_ref').value.trim()
    };
    if(sec==='scores') return {
        score_id: document.getElementById('s_id').value.trim(),
        match_id: document.getElementById('s_match').value.trim(),
        team_id: document.getElementById('s_team').value.trim(),
        points_scored: parseInt(document.getElementById('s_pts').value, 10),
        result_status: document.getElementById('s_status').value
    };
}

// ── INIT ────────────────────────────────────────────────────────────────
switchSection('players'); // Boot initial state
