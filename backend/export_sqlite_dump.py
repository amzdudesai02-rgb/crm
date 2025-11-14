import sqlite3

conn = sqlite3.connect("leveragecrm.db")
with open("dump.sql", "w", encoding="utf-8") as f:
    for line in conn.iterdump():
        f.write(f"{line}\n")

conn.close()
print("Dump exported to dump.sql")
