// function addSchemaToTables(sql, schemaName) {
//     // Split the SQL script into individual statements based on semicolons
//     const statements = sql.split(';');

//     // Iterate through each statement and add the schemaName to table names
//     const modifiedStatements = statements.map(statement => {
//         // Check if the statement is not empty
//         if (statement.trim() !== '') {
//             // Use regular expression to find and replace table names with schemaName.tableName
//             return statement.replace(/(\b(?:create|table)\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g, `$1${schemaName}.$2`);
//         } else {
//             return statement;
//         }
//     });

//     // Join the modified statements back into a single SQL script
//     const modifiedSql = modifiedStatements.join(';');

//     return modifiedSql;
// }

function addSchemaToTables(sql, schemaName) {
    // Split the SQL script into individual statements based on semicolons
    const statements = sql.split(';');

    // Iterate through each statement and add the schemaName to table names
    const modifiedStatements = statements.map(statement => {
        // Check if the statement is not empty
        if (statement.trim() !== '') {
            // Use regular expression to find and replace table names with schemaName.tableName
            return statement.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s+\()/g, `${schemaName}.$1`);
        } else {
            return statement;
        }
    });

    // Join the modified statements back into a single SQL script
    const modifiedSql = modifiedStatements.join(';');

    return modifiedSql;
}

module.exports = { addSchemaToTables }
