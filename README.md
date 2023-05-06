###
# nutrition-lookup
NodeJS-based console app, looks up nutrition information from a public web service and prints to the console and/or a CSV file you designate.


To use, you will need a (free) account with https://trackapi.nutritionix.com. Once you register, set up your environment to use your own APP_ID and APP_KEY:

1. Copy `.env.template` to a new file named `.env`.
2. Replace `YOUR_APP_ID_HERE` with your actual APP ID.
3. Replace `YOUR_KEY_HERE` with your actual APP Key.
4. Save the file.

You will also need the following NodeJS modules:
```  
"dependencies": {
    "csv-writer": "^1.6.0",
    "dotenv": "^16.0.3",
    "yargs": "^17.7.1"
  }
  ```

Once your environment is set, you can get check access to the webservice by running 
```
node nutrition.js -i spinach
```

To get information with totals for more than one item, you can do
```
node nutrition.js --item spinach --item "1 tbsp olive oil" --total
```

Or, secret shortcut hack version of same:
```
node nutrition.js --item="1 cup spinach; 1 tbsp olive oil" --total
```


  Run with `--help` to get a full list of options:
  ```
  node nutrition.js --help

  Options:
      --help       Show help                                           [boolean]
      --version    Show version number                                 [boolean]
  -o, --outfile    Filename for CSV output. Adds --csv                  [string]
  -i, --item       A food item to look up. Multiple args are sent together to
                   WS.                                        [array] [required]
  -c, --csv        Produce CSV output.                [boolean] [default: false]
      --console    Produce a report on the console even if CSV is selected.
                                                      [boolean] [default: false]
  -n, --noappend   Overwrite CSV file if it exists    [boolean] [default: false]
      --echo       Echo CSV output to console.        [boolean] [default: false]
  -t, --total      Include totals (in console mode)   [boolean] [default: false]
      --totalonly  Only show totals (in console mode) [boolean] [default: false]
```
