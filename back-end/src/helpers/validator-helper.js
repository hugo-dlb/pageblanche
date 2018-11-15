
const INVALID_PARAMETERS = {
    success: false,
    message: 'Invalid parameters.',
    data: null
};

// validate a coding action: write or delete characters
exports.validateCodingRequest = function(req, res) {
    const action = req.body || null;

    if (!action || !action.type || !['WRITE', 'DELETE'].includes(action.type)
        || typeof action.row !== 'number' || typeof action.column !== 'number') {
        res.status(400).send(INVALID_PARAMETERS);
        return false;
    } else {
        action.value = String(action.value);
        if (action.type === 'WRITE') {
            if (!action.value || action.value === undefined || action.value === null || action.value.length === 0) {
                res.status(400).send(INVALID_PARAMETERS);
                return false;
            }
        }
    }

    return true;
};