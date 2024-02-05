function removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
        const filteredArray = obj
            .map(item => removeEmptyValues(item))
            .filter(item => {
                if (Array.isArray(item)) {
                    return item.length !== 0;
                }
                return Object.keys(item).length !== 0;
            })
            .filter(item => {
                if (Array.isArray(item) && item.length === 1 && typeof item[0] === 'string') {
                    return item[0].trim() !== '';
                }
                return true;
            });
        return filteredArray.length !== 0 ? filteredArray : [];
    } else if (typeof obj === 'object' && obj !== null) {
        const filteredObject = Object.fromEntries(
            Object.entries(obj)
                .map(([key, value]) => [key, removeEmptyValues(value)])
                .filter(([_, value]) => {
                    if (Array.isArray(value)) {
                        return value.length !== 0;
                    }
                    return value !== '';
                })
        );
        return Object.keys(filteredObject).length !== 0 ? filteredObject : {};
    }
    return obj;
}


function filterObjects(testdata) {
    return testdata.filter(obj => {
        // Modify the property names according to your object structure
        const values = Object.values(obj);
        const invalidValues = ["", "0", "Yes", "No", "        "];

        // Check if any value in the object matches the invalid values
        return values.some(value => !invalidValues.includes(value));
    });
}

module.exports = { removeEmptyValues, filterObjects }