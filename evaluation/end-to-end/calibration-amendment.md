# Calibration v1 measurement correction, before any scored run

Both agents found all four sites and completed dispositions. Serene skipped both
ordinary bodies after handoff. Both had already read both ordinary bodies in
Discovery. No efficiency conclusion is selected from this preparation sample.

The initial gate failed on three measurement/interface issues:
- End ranges beyond EOF caused six invalid-range responses across the pair.
  Read now clamps only the end to EOF, like a normal source viewer. Starts outside
  the file and inverted ranges still fail. Delivered ranges remain fully recorded.
- Raw finding identified the concatenation at line 27 and explicitly linked query
  execution at line 29. Its mechanism was correct, but scoring demanded execution
  line 29. Finding localization now accepts a line within the correct function plus
  independently correct mechanism. Discovery coordinates remain exact, uncorrected.
- Serene diagnosed the dangerous site using source already read in Discovery, then
  reread the unmatched site. Requiring a second dangerous-body read would add
  artificial work. Gate now requires full source evidence at least once, a
  per-candidate non-skip disposition and correct diagnosis; post-handoff reads are
  still separately reported, and ordinary must still not be reread after handoff.

These change measurement of reviewer behavior, not the handoff's safety tests or
acceptance of ambiguous candidates. Initial logs, scores and failed gate remain
unchanged. The revised method will be reviewed independently and exercised by a
new fresh calibration pair cr2/cs2 before freezing scored runs. No scored run has
started. No fixture/source/gold changes follow calibration v1.
