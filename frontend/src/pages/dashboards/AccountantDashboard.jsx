<Grid container spacing={3} sx={{ mb: 3 }}>
  {/* Workers card (gradient) */}
  <Grid item xs={12} sm={6} md={2.4}>
    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Workers</Typography>
        <Typography variant="h3">{stats.workers}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>{pendingWorkersCount} pending</Typography>
      </CardContent>
    </Card>
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
    <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
      <CardContent>
        <Typography variant="body2" color="textSecondary">Projects</Typography>
        <Typography variant="h4" color="#2196f3">{stats.projects}</Typography>
      </CardContent>
    </Card>
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
    <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
      <CardContent>
        <Typography variant="body2" color="textSecondary">Total Released</Typography>
        <Typography variant="h4" color="#4caf50">{formatCurrency(stats.totalReleased)}</Typography>
      </CardContent>
    </Card>
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
    <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
      <CardContent>
        <Typography variant="body2" color="textSecondary">Funding Requests</Typography>
        <Typography variant="h4" color="#ff9800">{stats.fundingRequests}</Typography>
        <Typography variant="caption" color="textSecondary">
          {pendingFundingCount} awaiting funding ({approvedFundingCount} approved)
        </Typography>
      </CardContent>
    </Card>
  </Grid>
  {/* 👇 NEW Visitors card */}
  <Grid item xs={12} sm={6} md={2.4}>
    <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
      <CardContent>
        <Typography variant="body2" color="textSecondary">Visitors</Typography>
        <Typography variant="h4" color="#9c27b0">{stats.visitors}</Typography>
        <Typography variant="caption" color="textSecondary">{stats.todayVisitors} today</Typography>
      </CardContent>
    </Card>
  </Grid>
</Grid>