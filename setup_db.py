"""
setup_db.py
Automated script to initialize the Oracle database with all required tables.
"""

import oracledb
from db_config import get_db_connection

def setup_database():
    statements = [
        # DROPS (in dependency order)
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE SCORES CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE MATCHES CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE REGISTRATIONS CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE REFEREES CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE PLAYER CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE TEAM CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE TOURNAMENT CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE VENUE CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",

        # CREATES
        """
        CREATE TABLE TOURNAMENT (
            TOURNAMENT_ID NUMBER PRIMARY KEY,
            TOURNAMENT_NAME VARCHAR2(100) NOT NULL,
            SPORT_TYPE VARCHAR2(100),
            START_DATE DATE,
            END_DATE DATE,
            LOCATION VARCHAR2(150),
            ORGANIZER_NAME VARCHAR2(100)
        )
        """,
        """
        CREATE TABLE TEAM (
            TEAM_ID NUMBER PRIMARY KEY,
            TEAM_NAME VARCHAR2(100) NOT NULL,
            COACH_NAME VARCHAR2(100),
            CITY VARCHAR2(100),
            CONTACT_NUMBER VARCHAR2(50)
        )
        """,
        """
        CREATE TABLE PLAYER (
            PLAYER_ID NUMBER PRIMARY KEY,
            TEAM_ID NUMBER,
            PLAYER_NAME VARCHAR2(100) NOT NULL,
            AGE NUMBER(3),
            GENDER VARCHAR2(20),
            POSITION VARCHAR2(50),
            CONSTRAINT fk_player_team FOREIGN KEY (TEAM_ID) REFERENCES TEAM(TEAM_ID)
        )
        """,
        """
        CREATE TABLE VENUE (
            VENUE_ID NUMBER PRIMARY KEY,
            VENUE_NAME VARCHAR2(100) NOT NULL,
            LOCATION VARCHAR2(150),
            CAPACITY NUMBER
        )
        """,
        """
        CREATE TABLE REFEREES (
            REFEREE_ID NUMBER PRIMARY KEY,
            REFEREE_NAME VARCHAR2(100) NOT NULL,
            EXPERIENCE_YEARS NUMBER,
            CONTACT_NUMBER VARCHAR2(50)
        )
        """,
        """
        CREATE TABLE MATCHES (
            MATCH_ID NUMBER PRIMARY KEY,
            TOURNAMENT_ID NUMBER,
            MATCH_DATE DATE,
            MATCH_TIME VARCHAR2(50),
            MATCH_TYPE VARCHAR2(100),
            VENUE_ID NUMBER,
            REFEREE_ID NUMBER,
            CONSTRAINT fk_match_tourn FOREIGN KEY (TOURNAMENT_ID) REFERENCES TOURNAMENT(TOURNAMENT_ID),
            CONSTRAINT fk_match_venue FOREIGN KEY (VENUE_ID) REFERENCES VENUE(VENUE_ID),
            CONSTRAINT fk_match_ref FOREIGN KEY (REFEREE_ID) REFERENCES REFEREES(REFEREE_ID)
        )
        """,
        """
        CREATE TABLE SCORES (
            SCORE_ID NUMBER PRIMARY KEY,
            MATCH_ID NUMBER,
            POINTS_SCORED NUMBER,
            RESULT_STATUS VARCHAR2(50),
            TEAM_ID NUMBER,
            CONSTRAINT fk_score_match FOREIGN KEY (MATCH_ID) REFERENCES MATCHES(MATCH_ID),
            CONSTRAINT fk_score_team FOREIGN KEY (TEAM_ID) REFERENCES TEAM(TEAM_ID)
        )
        """,
        """
        CREATE TABLE REGISTRATIONS (
            REGISTRATION_ID NUMBER PRIMARY KEY,
            REGISTRATION_DATE DATE,
            TOURNAMENT_ID NUMBER,
            TEAM_ID NUMBER,
            CONSTRAINT fk_reg_tourn FOREIGN KEY (TOURNAMENT_ID) REFERENCES TOURNAMENT(TOURNAMENT_ID),
            CONSTRAINT fk_reg_team FOREIGN KEY (TEAM_ID) REFERENCES TEAM(TEAM_ID)
        )
        """
    ]

    try:
        print("Connecting to Oracle Database...")
        conn = get_db_connection()
        print("Connected successfully!")
        
        cursor = conn.cursor()
        
        for stmt in statements:
            print(f"Executing: {stmt[:50].strip()}...")
            cursor.execute(stmt)
                
        conn.commit()
        print("\nAll tables created successfully! The database is fully initialized.")
        
    except Exception as e:
        print(f"\nError initializing database: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    setup_database()
