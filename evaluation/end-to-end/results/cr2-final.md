Completed the SQL construction review for revision 0e5e926038b37fe8d99b2049a4b548eb4d866226.

- Found and reviewed 4 execution sites in operations.ts.
- Recorded one SQL injection finding: searchCalibration line 27 concatenates HTTP-originated UntrustedInput directly into an ILIKE SQL literal.
- Dispositioned all candidates: listActive, markComplete, and sendCalibrationSnapshot safe; searchCalibration unsafe.
- Finished the recorder successfully.
