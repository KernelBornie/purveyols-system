// ─── Convert bid to Tender ──────────────────────────────
router.post('/:id/convert-to-tender', auth, async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.isConvertedToTender) {
      return res.status(400).json({ error: 'This bid has already been forwarded to Tenders' });
    }

    // Parse budget as number
    const budgetNumber = parseFloat(String(bid.budget).replace(/[^0-9.-]+/g, '')) || 0;

    // Build notes with all extra info
    const notesParts = [
      `Forwarded from bidded project "${bid.projectTitle}" (ID: ${bid.projectId})`,
    ];
    if (bid.source) notesParts.push(`Source: ${bid.source}`);
    if (bid.sourceUrl) notesParts.push(`Source URL: ${bid.sourceUrl}`);
    if (bid.skills && bid.skills.length) notesParts.push(`Skills: ${bid.skills.join(', ')}`);
    if (bid.biddingFee) notesParts.push(`Bidding Fee: ${bid.biddingFee}`);
    if (bid.notes) notesParts.push(`Original Notes: ${bid.notes}`);
    const notes = notesParts.join(' | ');

    const tender = new Tender({
      title: bid.projectTitle || 'Untitled Tender',
      referenceNumber: `TND-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      client: bid.client || 'Unknown Client',
      clientAddress: bid.location || '',
      clientEmail: bid.contactEmail || '',
      clientPhone: bid.contactPhone || '',
      type: 'tender',
      projectName: bid.projectTitle || '',
      location: bid.location || '',
      description: bid.description || '',
      dueDate: bid.deadline ? new Date(bid.deadline) : null,
      status: 'draft',
      createdBy: req.user.id,
      priceProposal: {
        subtotal: budgetNumber,
        grandTotal: budgetNumber,
        currency: 'ZMW',
        percentageAdjustment: 0,
        contingencies: 0,
        vat: 0,
        exchangeRate: 1,
      },
      notes: notes,
    });

    await tender.save();

    // Link the bid to the tender
    bid.convertedToTender = tender._id;
    bid.isConvertedToTender = true;
    bid.updatedAt = new Date();
    await bid.save();

    // Populate the tender for response
    const populatedTender = await Tender.findById(tender._id)
      .populate('createdBy', 'name role');

    res.status(201).json({
      message: '✅ Tender created successfully from bid!',
      tender: populatedTender,
      bid
    });
  } catch (err) {
    console.error('Convert bid to tender error:', err);
    res.status(500).json({ error: err.message });
  }
});