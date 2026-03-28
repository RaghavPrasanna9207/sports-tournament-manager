"""
db_config.py — Database Configuration Module
=============================================
This module provides a single function, get_db_connection(), that returns an
Oracle database connection using the 'oracledb' driver in **Thin mode**
(no Oracle Client installation required).

WHY IS THIS A SEPARATE FILE?
-----------------------------
1. Security — Credentials are isolated in one file that can be added to
   .gitignore so they never get committed to version control.
2. Environment overrides — Swap credentials per environment (dev / staging /
   prod) without touching application logic.
3. Single responsibility — app.py handles routing; this file handles
   connectivity.
"""

import oracledb


def get_db_connection():
    """
    Create and return an Oracle database connection using Thin mode.

    DSN (Data Source Name) format
    -----------------------------
    A DSN tells the driver *where* the database is and *which* service to
    connect to.  The Easy Connect format used below is:

        HOST:PORT/SERVICE_NAME

    Replace the placeholders below with your actual Oracle credentials:
      - YOUR_USERNAME  → e.g. "SPORTS_ADMIN"
      - YOUR_PASSWORD  → e.g. "SecurePass123"
      - YOUR_HOST      → e.g. "localhost" or "192.168.1.50"
      - YOUR_PORT      → e.g. "1521" (Oracle default)
      - YOUR_SERVICE   → e.g. "XEPDB1" or "ORCL"

    Returns
    -------
    oracledb.Connection
        An open connection to the Oracle database.

    Raises
    ------
    oracledb.Error
        If the connection attempt fails (wrong credentials, DB unreachable,
        etc.).  A diagnostic message is printed before the exception
        propagates so the developer gets actionable feedback.
    """

    # ── Replace these placeholders with real values ──────────────────────
    DB_USER = "system"
    DB_PASSWORD = "Sarojasamannikalo123$%"
    DB_DSN = "The-Ragtop:1521/XE"  # e.g. "localhost:1521/XEPDB1"
    # ─────────────────────────────────────────────────────────────────────


    try:
        connection = oracledb.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            dsn=DB_DSN
        )
        return connection

    except oracledb.Error as e:
        print("\n" + "=" * 60)
        print("DATABASE CONNECTION ERROR")
        print("=" * 60)
        print(f"Could not connect to Oracle database.")
        print(f"  DSN  : {DB_DSN}")
        print(f"  User : {DB_USER}")
        print(f"  Error: {e}")
        print("\nTroubleshooting tips:")
        print("  1. Verify your username and password are correct.")
        print("  2. Ensure the Oracle DB is running and reachable at the DSN above.")
        print("  3. Check that the service name (e.g. XEPDB1) exists on the server.")
        print("  4. If using Oracle XE, the default port is 1521.")
        print("=" * 60 + "\n")
        raise
