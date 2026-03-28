"""
app.py — Flask Application for Sports Tournament System
========================================================
Single-Page Application backend for full CRUD across Players, Teams,
Tournaments, and Venues.

Handles Oracle constraints cleanly (returning 400 JSONs) via `_parse_oracle_error()`.
"""

from flask import Flask, render_template, request, jsonify
from db_config import get_db_connection
import oracledb

app = Flask(__name__)

# ─────────────────────────────────────────────────────────────────────────
# Helper: Parse Oracle errors and return a user-friendly message + status
# ─────────────────────────────────────────────────────────────────────────

def _parse_oracle_error(e, operation="operation"):
    error_obj, = e.args
    ora_code = error_obj.code

    friendly_messages = {
        1:    "A record with this ID already exists. Please use a unique ID.",
        2290: "CHECK constraint violated — please ensure all fields meet business rules.",
        2291: "Foreign Key error — the referenced entity does not exist.",
        2292: "Cannot delete — there are dependent records assigned to this entity.",
    }

    if ora_code in friendly_messages:
        return jsonify({"error": friendly_messages[ora_code]}), 400

    return jsonify({
        "error": f"Database error during {operation}.",
        "details": str(error_obj.message)
    }), 500


# ═══════════════════════════════════════════════════════════════════════════
# UI ROUTE — Single-Page Application shell
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    return render_template("index.html")


# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — PLAYERS
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/players", methods=["GET"])
def get_players():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM PLAYER")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            players = [dict(zip(columns, row)) for row in rows]
        return jsonify(players), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching players")
    finally:
        if conn: conn.close()

@app.route("/api/players", methods=["POST"])
def add_player():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO PLAYER
                    (PLAYER_ID, PLAYER_NAME, AGE, GENDER, POSITION, TEAM_ID)
                VALUES
                    (:player_id, :player_name, :age, :gender, :position, :team_id)
                """,
                {
                    "player_id": data.get("player_id"),
                    "player_name": data.get("player_name"),
                    "age":       data.get("age"),
                    "gender":    data.get("gender"),
                    "position":  data.get("position"),
                    "team_id":   data.get("team_id")
                }
            )
        conn.commit()
        return jsonify({"message": "Player added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding player")
    finally:
        if conn: conn.close()

@app.route("/api/players/<player_id>", methods=["PUT"])
def update_player(player_id):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE PLAYER
                SET PLAYER_NAME = :player_name,
                    AGE      = :age,
                    GENDER   = :gender,
                    POSITION = :position,
                    TEAM_ID  = :team_id
                WHERE PLAYER_ID = :player_id
                """,
                {
                    "player_name": data.get("player_name"),
                    "age":       data.get("age"),
                    "gender":    data.get("gender"),
                    "position":  data.get("position"),
                    "team_id":   data.get("team_id"),
                    "player_id": player_id
                }
            )
        conn.commit()
        return jsonify({"message": "Player updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating player")
    finally:
        if conn: conn.close()

@app.route("/api/players/<player_id>", methods=["DELETE"])
def delete_player(player_id):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM PLAYER WHERE PLAYER_ID = :player_id", {"player_id": player_id})
        conn.commit()
        return jsonify({"message": "Player deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting player")
    finally:
        if conn: conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — TEAMS
# Schema: TEAM_ID, TEAM_NAME, COACH_NAME, CITY, CONTACT_NUMBER
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/teams", methods=["GET"])
def get_teams():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM TEAM")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            teams = [dict(zip(columns, row)) for row in rows]
        return jsonify(teams), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching teams")
    finally:
        if conn: conn.close()

@app.route("/api/teams", methods=["POST"])
def add_team():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO TEAM (TEAM_ID, TEAM_NAME, COACH_NAME, CITY, CONTACT_NUMBER) VALUES (:team_id, :team_name, :coach_name, :city, :contact_number)",
                {
                    "team_id":        data.get("team_id"),
                    "team_name":      data.get("team_name"),
                    "coach_name":     data.get("coach_name"),
                    "city":           data.get("city"),
                    "contact_number": data.get("contact_number")
                }
            )
        conn.commit()
        return jsonify({"message": "Team added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding team")
    finally:
        if conn: conn.close()

@app.route("/api/teams/<team_id>", methods=["PUT"])
def update_team(team_id):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE TEAM
                SET TEAM_NAME      = :team_name,
                    COACH_NAME     = :coach_name,
                    CITY           = :city,
                    CONTACT_NUMBER = :contact_number
                WHERE TEAM_ID      = :team_id
                """,
                {
                    "team_name":      data.get("team_name"),
                    "coach_name":     data.get("coach_name"),
                    "city":           data.get("city"),
                    "contact_number": data.get("contact_number"),
                    "team_id":        team_id
                }
            )
        conn.commit()
        return jsonify({"message": "Team updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating team")
    finally:
        if conn: conn.close()

@app.route("/api/teams/<team_id>", methods=["DELETE"])
def delete_team(team_id):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM TEAM WHERE TEAM_ID = :team_id", {"team_id": team_id})
        conn.commit()
        return jsonify({"message": "Team deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting team")
    finally:
        if conn: conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — TOURNAMENTS
# Schema: TOURNAMENT_ID, TOURNAMENT_NAME, SPORT_TYPE, START_DATE, END_DATE, LOCATION, ORGANIZER_NAME
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/tournaments", methods=["GET"])
def get_tournaments():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM TOURNAMENT")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            t = [dict(zip(columns, row)) for row in rows]
        return jsonify(t), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching tournaments")
    finally:
        if conn: conn.close()

@app.route("/api/tournaments", methods=["POST"])
def add_tournament():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO TOURNAMENT (TOURNAMENT_ID, TOURNAMENT_NAME, SPORT_TYPE, START_DATE, END_DATE, LOCATION, ORGANIZER_NAME)
                VALUES (:tid, :tournament_name, :sport_type, TO_DATE(:start_date, 'YYYY-MM-DD'), TO_DATE(:end_date, 'YYYY-MM-DD'), :location, :organizer_name)
                """,
                {
                    "tid":             data.get("tournament_id"),
                    "tournament_name": data.get("tournament_name"),
                    "sport_type":      data.get("sport_type"),
                    "start_date":      data.get("start_date"),
                    "end_date":        data.get("end_date"),
                    "location":        data.get("location"),
                    "organizer_name":  data.get("organizer_name")
                }
            )
        conn.commit()
        return jsonify({"message": "Tournament added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding tournament")
    finally:
        if conn: conn.close()

@app.route("/api/tournaments/<tid>", methods=["PUT"])
def update_tournament(tid):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE TOURNAMENT
                SET TOURNAMENT_NAME = :tournament_name,
                    SPORT_TYPE     = :sport_type,
                    START_DATE     = TO_DATE(:start_date, 'YYYY-MM-DD'),
                    END_DATE       = TO_DATE(:end_date, 'YYYY-MM-DD'),
                    LOCATION       = :location,
                    ORGANIZER_NAME = :organizer_name
                WHERE TOURNAMENT_ID = :tid
                """,
                {
                    "tournament_name": data.get("tournament_name"),
                    "sport_type":      data.get("sport_type"),
                    "start_date":      data.get("start_date"),
                    "end_date":        data.get("end_date"),
                    "location":        data.get("location"),
                    "organizer_name":  data.get("organizer_name"),
                    "tid":             tid
                }
            )
        conn.commit()
        return jsonify({"message": "Tournament updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating tournament")
    finally:
        if conn: conn.close()

@app.route("/api/tournaments/<tid>", methods=["DELETE"])
def delete_tournament(tid):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM TOURNAMENT WHERE TOURNAMENT_ID = :tid", {"tid": tid})
        conn.commit()
        return jsonify({"message": "Tournament deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting tournament")
    finally:
        if conn: conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — VENUES
# Schema: VENUE_ID, VENUE_NAME, LOCATION, CAPACITY
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/venues", methods=["GET"])
def get_venues():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM VENUE")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            v = [dict(zip(columns, row)) for row in rows]
        return jsonify(v), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching venues")
    finally:
        if conn: conn.close()

@app.route("/api/venues", methods=["POST"])
def add_venue():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO VENUE (VENUE_ID, VENUE_NAME, LOCATION, CAPACITY) VALUES (:vid, :venue_name, :loc, :cap)",
                {
                    "vid":        data.get("venue_id"),
                    "venue_name": data.get("venue_name"),
                    "loc":  data.get("location"),
                    "cap":  data.get("capacity")
                }
            )
        conn.commit()
        return jsonify({"message": "Venue added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding venue")
    finally:
        if conn: conn.close()

@app.route("/api/venues/<vid>", methods=["PUT"])
def update_venue(vid):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE VENUE
                SET VENUE_NAME = :venue_name,
                    LOCATION = :loc,
                    CAPACITY = :cap
                WHERE VENUE_ID = :vid
                """,
                {
                    "venue_name": data.get("venue_name"),
                    "loc":  data.get("location"),
                    "cap":  data.get("capacity"),
                    "vid":  vid
                }
            )
        conn.commit()
        return jsonify({"message": "Venue updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating venue")
    finally:
        if conn: conn.close()

@app.route("/api/venues/<vid>", methods=["DELETE"])
def delete_venue(vid):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
             cursor.execute("DELETE FROM VENUE WHERE VENUE_ID = :vid", {"vid": vid})
        conn.commit()
        return jsonify({"message": "Venue deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting venue")
    finally:
        if conn: conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — REFEREES
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/referees", methods=["GET"])
def get_referees():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM REFEREE")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            res = [dict(zip(columns, row)) for row in rows]
        return jsonify(res), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching referees")
    finally:
        if conn: conn.close()

@app.route("/api/referees", methods=["POST"])
def add_referee():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO REFEREE (REFEREE_ID, REFEREE_NAME, EXPERIENCE_YEARS, CONTACT_NUMBER) VALUES (:rid, :rname, :exp, :contact)",
                {
                    "rid": data.get("referee_id"),
                    "rname": data.get("referee_name"),
                    "exp": data.get("experience_years"),
                    "contact": data.get("contact_number")
                }
            )
        conn.commit()
        return jsonify({"message": "Referee added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding referee")
    finally:
        if conn: conn.close()

@app.route("/api/referees/<rid>", methods=["PUT"])
def update_referee(rid):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE REFEREE
                SET REFEREE_NAME = :rname,
                    EXPERIENCE_YEARS = :exp,
                    CONTACT_NUMBER = :contact
                WHERE REFEREE_ID = :rid
                """,
                {
                    "rname": data.get("referee_name"),
                    "exp": data.get("experience_years"),
                    "contact": data.get("contact_number"),
                    "rid": rid
                }
            )
        conn.commit()
        return jsonify({"message": "Referee updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating referee")
    finally:
        if conn: conn.close()

@app.route("/api/referees/<rid>", methods=["DELETE"])
def delete_referee(rid):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
             cursor.execute("DELETE FROM REFEREE WHERE REFEREE_ID = :rid", {"rid": rid})
        conn.commit()
        return jsonify({"message": "Referee deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting referee")
    finally:
        if conn: conn.close()

# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — REGISTRATIONS
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/registrations", methods=["GET"])
def get_registrations():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM TOURNAMENT_REGISTRATION")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            res = [dict(zip(columns, row)) for row in rows]
        return jsonify(res), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching registrations")
    finally:
        if conn: conn.close()

@app.route("/api/registrations", methods=["POST"])
def add_registration():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO TOURNAMENT_REGISTRATION (REGISTRATION_ID, REGISTRATION_DATE, TOURNAMENT_ID, TEAM_ID)
                VALUES (:rid, TO_DATE(:rdate, 'YYYY-MM-DD'), :tid, :teamid)
                """,
                {
                    "rid": data.get("registration_id"),
                    "rdate": data.get("registration_date"),
                    "tid": data.get("tournament_id"),
                    "teamid": data.get("team_id")
                }
            )
        conn.commit()
        return jsonify({"message": "Registration added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding registration")
    finally:
        if conn: conn.close()

@app.route("/api/registrations/<rid>", methods=["PUT"])
def update_registration(rid):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE TOURNAMENT_REGISTRATION
                SET REGISTRATION_DATE = TO_DATE(:rdate, 'YYYY-MM-DD'),
                    TOURNAMENT_ID = :tid,
                    TEAM_ID = :teamid
                WHERE REGISTRATION_ID = :rid
                """,
                {
                    "rdate": data.get("registration_date"),
                    "tid": data.get("tournament_id"),
                    "teamid": data.get("team_id"),
                    "rid": rid
                }
            )
        conn.commit()
        return jsonify({"message": "Registration updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating registration")
    finally:
        if conn: conn.close()

@app.route("/api/registrations/<rid>", methods=["DELETE"])
def delete_registration(rid):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
             cursor.execute("DELETE FROM TOURNAMENT_REGISTRATION WHERE REGISTRATION_ID = :rid", {"rid": rid})
        conn.commit()
        return jsonify({"message": "Registration deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting registration")
    finally:
        if conn: conn.close()

# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — MATCHES
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/matches", methods=["GET"])
def get_matches():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM MATCH")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            res = [dict(zip(columns, row)) for row in rows]
        return jsonify(res), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching matches")
    finally:
        if conn: conn.close()

@app.route("/api/matches", methods=["POST"])
def add_match():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO MATCH (MATCH_ID, TOURNAMENT_ID, MATCH_DATE, MATCH_TIME, MATCH_TYPE, VENUE_ID, REFEREE_ID)
                VALUES (:mid, :tid, TO_DATE(:mdate, 'YYYY-MM-DD'), :mtime, :mtype, :vid, :rid)
                """,
                {
                    "mid": data.get("match_id"),
                    "tid": data.get("tournament_id"),
                    "mdate": data.get("match_date"),
                    "mtime": data.get("match_time"),
                    "mtype": data.get("match_type"),
                    "vid": data.get("venue_id"),
                    "rid": data.get("referee_id")
                }
            )
        conn.commit()
        return jsonify({"message": "Match added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding match")
    finally:
        if conn: conn.close()

@app.route("/api/matches/<mid>", methods=["PUT"])
def update_match(mid):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE MATCH
                SET TOURNAMENT_ID = :tid,
                    MATCH_DATE = TO_DATE(:mdate, 'YYYY-MM-DD'),
                    MATCH_TIME = :mtime,
                    MATCH_TYPE = :mtype,
                    VENUE_ID = :vid,
                    REFEREE_ID = :rid
                WHERE MATCH_ID = :mid
                """,
                {
                    "tid": data.get("tournament_id"),
                    "mdate": data.get("match_date"),
                    "mtime": data.get("match_time"),
                    "mtype": data.get("match_type"),
                    "vid": data.get("venue_id"),
                    "rid": data.get("referee_id"),
                    "mid": mid
                }
            )
        conn.commit()
        return jsonify({"message": "Match updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating match")
    finally:
        if conn: conn.close()

@app.route("/api/matches/<mid>", methods=["DELETE"])
def delete_match(mid):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
             cursor.execute("DELETE FROM MATCH WHERE MATCH_ID = :mid", {"mid": mid})
        conn.commit()
        return jsonify({"message": "Match deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting match")
    finally:
        if conn: conn.close()

# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES — SCORES
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/scores", methods=["GET"])
def get_scores():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM SCORE")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            res = [dict(zip(columns, row)) for row in rows]
        return jsonify(res), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "fetching scores")
    finally:
        if conn: conn.close()

@app.route("/api/scores", methods=["POST"])
def add_score():
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO SCORE (SCORE_ID, MATCH_ID, TEAM_ID, POINTS_SCORED, RESULT_STATUS)
                VALUES (:sid, :mid, :tid, :pts, :status)
                """,
                {
                    "sid": data.get("score_id"),
                    "mid": data.get("match_id"),
                    "tid": data.get("team_id"),
                    "pts": data.get("points_scored"),
                    "status": data.get("result_status")
                }
            )
        conn.commit()
        return jsonify({"message": "Score added successfully."}), 201
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "adding score")
    finally:
        if conn: conn.close()

@app.route("/api/scores/<sid>", methods=["PUT"])
def update_score(sid):
    conn = None
    try:
        data = request.get_json()
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE SCORE
                SET MATCH_ID = :mid,
                    TEAM_ID = :tid,
                    POINTS_SCORED = :pts,
                    RESULT_STATUS = :status
                WHERE SCORE_ID = :sid
                """,
                {
                    "mid": data.get("match_id"),
                    "tid": data.get("team_id"),
                    "pts": data.get("points_scored"),
                    "status": data.get("result_status"),
                    "sid": sid
                }
            )
        conn.commit()
        return jsonify({"message": "Score updated successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "updating score")
    finally:
        if conn: conn.close()

@app.route("/api/scores/<sid>", methods=["DELETE"])
def delete_score(sid):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
             cursor.execute("DELETE FROM SCORE WHERE SCORE_ID = :sid", {"sid": sid})
        conn.commit()
        return jsonify({"message": "Score deleted successfully."}), 200
    except oracledb.DatabaseError as e:
        return _parse_oracle_error(e, "deleting score")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    app.run(debug=True)
