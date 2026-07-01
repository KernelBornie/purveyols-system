// ... (keep all previous code, only change the POST /:projectId/bid route)

// ─── POST /:projectId/bid – mark as bidded ────────────────────
router.post('/:projectId/bid', auth, async (req, res) => {
  try {
    const project = await AdvertisedProject.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status === 'bidded') return res.status(400).json({ error: 'Already bidded' });

    // Update advertised project status
    project.status = 'bidded';
    await project.save();

    // Create a Bid document using the new schema
    const bidData = {
      advertisedProjectId: project.id,  // custom string ID
      bidderId: req.user.id,
      amount: 0,  // default, can be updated later
      timeline: 'Not specified',
      status: 'bidded',
      bidDate: new Date(),
      projectTitle: project.title,
      client: project.client,
      location: project.location,
      budget: project.budget,
      deadline: project.deadline,
      source: project.source,
      sourceUrl: project.sourceUrl,
      description: project.description,
      skills: project.skills || [],
      contactEmail: project.contactEmail,
      biddingFee: project.biddingFee,
      notes: `Bidded from advertised project ${project.id}`,
    };
    const bid = new Bid(bidData);
    await bid.save();

    res.status(201).json({
      message: 'Project marked as bidded and Bid created!',
      project,
      bid
    });
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ error: err.message });
  }
});