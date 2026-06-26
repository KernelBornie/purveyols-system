// ─── Convert bid to Tender ──────────────────────────────
router.post('/:id/convert-to-tender', auth, async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.isConvertedToTender) {
      return res.status(400).json({ error: 'This bid has already been forwarded to Tenders' });
    }

    // Parse budget as number
    const budgetNumber = parseFloat(bid.budget?.replace(/[^0-9.-]+/g, '')) || 0;

    // Create a section with items from the description and skills
    const section = {
      name: 'Scope of Work',
      description: 'Auto-generated from bid description',
      items: [
        {
          description: bid.description || 'Work as described in the bid',
          quantity: 1,
          unit: 'Lot',
          unitPrice: budgetNumber,
          total: budgetNumber,
        }
      ],
      pageNumber: 1,
    };

    // Add skills as separate items if they exist
    if (bid.skills && bid.skills.length > 0) {
      bid.skills.forEach((skill, index) => {
        section.items.push({
          description: skill,
          quantity: 1,
          unit: 'Lot',
          unitPrice: 0,
          total: 0,
        });
      });
    }

    const tender = new Tender({
      title: bid.projectTitle || 'Untitled Tender',
      referenceNumber: `TND-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      client: bid.client || 'Unknown Client',
      clientAddress: '',
      clientEmail: bid.contactEmail || '',
      clientPhone: bid.contactPhone || '',
      type: 'tender',
      projectName: bid.projectTitle || '',
      location: bid.location || '',
      description: bid.description || '',
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
      // Add the section
      sections: [section],
      // Set the due date from bid's deadline
      dueDate: bid.deadline ? new Date(bid.deadline) : null,
      // Copy source info
      notes: `Forwarded from bidded project "${bid.projectTitle}" (ID: ${bid.projectId})`,
      // Add management information placeholder
      volumeII: {
        performanceSchedule: '',
        keyPersonnel: [],
        managementInformation: {
          bidderInfo: '',
          samRegistration: '',
          certifications: '',
          litigationStatus: '',
          politicalAffiliation: '',
          equipmentSchedule: '',
          companyProfile: '',
        },
        financialCapability: {
          bankStatements: [],
        },
        pastPerformance: [],
        preliminarySafetyPlan: '',
      },
      volumeI: {
        sf1442Received: false,
        priceBreakdown: '',
      },
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