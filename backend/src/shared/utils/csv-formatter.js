/**
 * CSV Formatter Utility
 * Proporciona funciones para formatear datos a CSV.
 */

/**
 * Convierte un array de objetos a una cadena de texto en formato CSV.
 * @param {Array<Object>} data - Los datos a convertir.
 * @returns {string} La cadena de texto en formato CSV.
 */
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            if (Array.isArray(value)) {
                return `"${value.join('|')}"`;
            }
            return `"${value || ''}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

module.exports = {
    convertToCSV
};
