"""Deterministic checks for supplied scalar function annotations."""

def _scalar_name(item):
    return item.get('function') if isinstance(item, dict) and isinstance(item.get('function'), str) else None

def _exact_key(item):
    if not isinstance(item, dict):
        return None
    file, line, column = item.get('file'), item.get('line'), item.get('column')
    return (file, line, column) if isinstance(file, str) and type(line) is int and type(column) is int else None

def _finding_record(item, gold_records):
    if not isinstance(item, dict) or 'column' in item:
        return None
    file, line = item.get('file'), item.get('line')
    if not isinstance(file, str) or type(line) is not int:
        return None
    return next((record for record in gold_records.values()
                 if record.get('file') == file
                 and record.get('functionBodyStartLine', 1) <= line <= record.get('functionBodyEndLine', 0)), None)

def supplied_name_check(items, gold_records, kind):
    """Score names exactly; do not parse, normalize, or repair supplied strings."""
    if not isinstance(items, list):
        return []
    if kind not in {'candidate', 'disposition', 'finding'}:
        raise ValueError('unknown annotation kind')
    checks = []
    for item in items:
        actual = _scalar_name(item)
        if kind == 'finding':
            record = _finding_record(item, gold_records)
            site = [item.get('file'), item.get('line')] if isinstance(item, dict) else [None, None]
            valid_schema = record is not None
        else:
            key = _exact_key(item)
            record = gold_records.get(key) if key is not None else None
            site = list(key) if key is not None else [None, None, None]
            valid_schema = record is not None
        expected = record.get('function') if record else None
        checks.append({'site': site, 'actual': actual, 'expected': expected,
                       'exact': bool(valid_schema and actual == expected),
                       'invalid_schema_or_coordinate': not valid_schema})
    return checks

def candidate_function_check(candidates, gold_by_key):
    expected = {key: record for key, record in gold_by_key.items()
                if record.get('classification') == 'ordinary'}
    checks = supplied_name_check(candidates, expected, 'candidate')
    checked = [check for check in checks if tuple(check['site']) in expected]
    missing = [check for check in checked if check['actual'] is None]
    wrong = [check for check in checked if check['actual'] is not None and not check['exact']]
    return {'checked': checked, 'missing': missing, 'wrong': wrong,
            'exact': sum(check['exact'] for check in checked), 'expected_sites': len(expected)}
