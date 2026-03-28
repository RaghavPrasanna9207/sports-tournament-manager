"""
update_schema.py
Adds Referees, Registrations, Matches, and Scores to the existing Sports Tournament DB.
All primary/foreign keys use NUMBER to match the base tables.
"""

import oracledb
from db_config import get_db_connection

def setup_new_entities():
    statements = [
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE SCORES CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE MATCHES CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE REGISTRATIONS CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",
        "BEGIN EXECUTE IMMEDIATE 'DROP TABLE REFEREES CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;",

        """
        CREATE TABLE REFEREE (
            REFEREE_ID NUMBER PRIMARY KEY,
            REFEREE_NAME VARCHAR2(100) NOT NULL,
            EXPERIENCE_YEARS NUMBER,
            CONTACT_NUMBER VARCHAR2(50)
        )
        """,
        """
        CREATE TABLE TOURNAMENT_REGISTRATION (
            REGISTRATION_ID NUMBER PRIMARY KEY,
            REGISTRATION_DATE DATE,
            TOURNAMENT_ID NUMBER,
            TEAM_ID NUMBER,
            CONSTRAINT fk_reg_tourn FOREIGN KEY (TOURNAMENT_ID) REFERENCES TOURNAMENT(TOURNAMENT_ID),
            CONSTRAINT fk_reg_team FOREIGN KEY (TEAM_ID) REFERENCES TEAM(TEAM_ID)
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
        print("\nAll 4 new tables created successfully!")
        
    except Exception as e:
        print(f"\nError updating database: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    setup_new_entities()
