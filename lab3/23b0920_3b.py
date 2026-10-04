from tabulate import tabulate
import psycopg2 as pg
from psycopg2 import sql
from parse import *

class PGShell:
    def __init__(self, hostname, port, database, username, password) -> None:
        self.hostname = hostname
        self.port = port
        self.database = database
        self.username = username
        self.password = password
        self.conn, self.cursor = self.connectDB()
                  
    def __del__(self) -> None:
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            
    def connectDB(self):
        """
        Establish a connection to PostgreSQL and return
        (connection, cursor).
        """
        try:
            conn = pg.connect(
                host=self.hostname,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password
            )
            cursor = conn.cursor()
            
            return conn, cursor
        except Exception as e:
            print(e)
    
    def loadSchema(self):
        """
        Load SQL schema from a file.
        """
        try:
            # TODO: Read file and execute SQL
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    event_id SERIAL PRIMARY KEY,
                    start_date DATE NOT NULL,
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    title TEXT NOT NULL
                );
            """)

            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS invitations (
                    id SERIAL PRIMARY KEY,
                    event_id INTEGER NOT NULL,
                    email TEXT NOT NULL,
                    FOREIGN KEY (event_id)
                        REFERENCES events(event_id)
                        ON DELETE CASCADE
                );
            """)
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(e)

    def addEvent(self, start_date, start_time, end_time, title):
        try:
            self.cursor.execute(
                """
                INSERT INTO events (start_date, start_time, end_time, title)
                VALUES (%s, %s, %s, %s);
                """,
                (start_date, start_time, end_time, title)
            )
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(e)

    def deleteEvent(self, event_id):
        try:
            self.cursor.execute(
                """
                DELETE FROM events
                WHERE event_id = %s;
                """,
                (event_id,)
            )
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(e)

    def listAllEvents(self):
        try:
            self.cursor.execute(
                """
                SELECT event_id, start_date, start_time, end_time, title
                FROM events
                ORDER BY start_date, start_time, end_time;
                """
            )
            rows = self.cursor.fetchall()
            print(tabulate(
                rows,
                headers=["event_id", "start_date", "start_time", "end_time", "title"],
                tablefmt="grid"
            ))
        except Exception as e:
            self.conn.rollback()
            print(e)

    def listTodayEvents(self):
        try:
            self.cursor.execute(
                """
                SELECT event_id, start_date, start_time, end_time, title
                FROM events
                WHERE start_date = CURRENT_DATE
                ORDER BY start_time, end_time;
                """
            )
            rows = self.cursor.fetchall()
            print(tabulate(
                rows,
                headers=["event_id", "start_date", "start_time", "end_time", "title"],
                tablefmt="grid"
            ))
        except Exception as e:
            self.conn.rollback()
            print(e)

    def addInvitation(self, event_id, invitee_email):
        try:
            self.cursor.execute(
                """
                INSERT INTO invitations (event_id, email)
                VALUES (%s, %s);
                """,
                (event_id, invitee_email)
            )
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(e)
    
    def removeInvitation(self, event_id, invitee_email):
        try:
            self.cursor.execute(
                """
                DELETE FROM invitations
                WHERE event_id = %s AND email = %s;
                """,
                (event_id, invitee_email)
            )
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(e)

    def showInvitations(self):
        try:
            self.cursor.execute(
                """
                SELECT event_id, email
                FROM invitations
                ORDER BY event_id, email;
                """
            )
            rows = self.cursor.fetchall()
            print(tabulate(
                rows,
                headers=["event_id", "email"],
                tablefmt="grid"
            ))
        except Exception as e:
            self.conn.rollback()
            print(e)


dbconn = None

# Command Parsing: DO NOT CHANGE ANYTHING BELOW THIS LINE
def parse_cmd(cmd):
    global dbconn
    cmd = str(cmd)

    if cmd.startswith("connect"):
        p = cmd.split()
        dbconn = PGShell(p[1], p[2], p[3], p[4], p[5])

    elif cmd == "ddl":
        dbconn.loadSchema()

    elif cmd.startswith("add "):
        # split only first 4 parts, rest is title
        parts = cmd.split(maxsplit=4)
        if len(parts) < 5:
            raise Exception("Invalid add command")

        _, start_date, start_time, end_time, title = parts
        dbconn.addEvent(start_date, start_time, end_time, title)

    elif cmd.startswith("delete "):
        parts = cmd.split()
        if len(parts) != 2:
            raise Exception("Invalid delete command")

        _, event_id = parts
        dbconn.deleteEvent(event_id)

    elif cmd == "list all":
        dbconn.listAllEvents()

    elif cmd == "list today":
        dbconn.listTodayEvents()

    elif cmd.startswith("invite "):
        parts = cmd.split()
        if len(parts) != 3:
            raise Exception("Invalid invite command")

        _, event_id, invitee_email = parts
        dbconn.addInvitation(event_id, invitee_email)

    elif cmd.startswith("drop "):
        parts = cmd.split()
        if len(parts) != 3:
            raise Exception("Invalid drop command")

        _, event_id, invitee_email = parts
        dbconn.removeInvitation(event_id, invitee_email)

    elif cmd == "list invites":
        dbconn.showInvitations()

    elif cmd == "quit":
        exit()

    else:
        raise Exception("Invalid Command")


def main():
    while True:
        cmd = input("pgshell# ").strip()
        parse_cmd(cmd)

if __name__ == '__main__':
    main()

