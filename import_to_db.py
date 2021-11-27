#! /usr/bin/env python3
import csv

import sqlite3
conn = sqlite3.connect('cards.db')

with open('sheets/input.csv', 'r') as sheet_file:
    sheet = csv.DictReader(sheet_file)

    c = conn.cursor()
    count = 0
    for row in sheet:
        count += 1
        quantity = row['Qty']
        if quantity == '':
            quantity = 1
        else:
            quantity = int(quantity)

        c.execute('''
            INSERT INTO Cards (
                name,
                identifier,
                quantity
            ) VALUES (?,?,?)
        ''', [
            row['Card Name'],
            row['Card Number'],
            quantity
        ])

    conn.commit()

    print(f'Wrote {count} rows to database')



