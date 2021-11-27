# pokemon card analysis

For results see [Analysis.ipynb](https://github.com/pkage/pokemon_card_data_analysis/blob/master/Analysis.ipynb)

## setup

```
$ git clone https://github.com/pkage/pokemon_card_data_analysis
$ cd pokemon_card_data_analysis
$ npm install
```

## general flow

1. Instantiate the database with `cat schema.sql | sqlite3 cards.db`
2. Place card data in `sheets/input.csv`
3. Import into database with `./import_to_db.py`
4. Download data from Mavin with `node search.js`
5. Run analysis with Jupyter Lab in `Analysis.ipynb`
