# Data Directory

Place your COVID-19 data CSV files in this directory.

## CSV File Format

Your CSV file should contain the following columns:

```csv
date,country,cases,deaths,recovered,active
```

### Column Descriptions

- `date`: Date of record in YYYY-MM-DD format
- `country`: Name of the country
- `cases`: Total confirmed cases
- `deaths`: Total deaths
- `recovered`: Total recovered cases
- `active`: Total active cases (can be calculated as cases - deaths - recovered)

### Example Data

```csv
date,country,cases,deaths,recovered,active
2023-01-01,USA,1000000,50000,900000,50000
2023-01-01,India,800000,40000,720000,40000
2023-01-01,Brazil,600000,30000,540000,30000
2023-01-02,USA,1010000,51000,908000,51000
2023-01-02,India,805000,40500,723500,41000
2023-01-02,Brazil,605000,30500,543000,31500
```

### Data Sources

You can obtain COVID-19 data from various reliable sources:

1. Johns Hopkins CSSE COVID-19 Dataset
2. WHO COVID-19 Dashboard
3. Our World in Data COVID-19 Dataset
4. National health organizations

### Data Processing Tips

1. Ensure dates are in YYYY-MM-DD format
2. Remove any commas from numeric values
3. Ensure all numeric columns contain valid numbers
4. Fill missing values appropriately (0 or previous value)
5. Remove any extra whitespace
6. Check for and handle any special characters in country names

### Validation

Before uploading, verify that your CSV file:

- Has all required columns
- Contains valid dates
- Has numeric values for cases, deaths, recovered, and active cases
- Has no missing country names
- Is properly formatted (no extra commas, quotes, etc.)

The dashboard will validate your file upon upload and show an error message if there are any issues. 