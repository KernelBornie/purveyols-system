// ... (existing imports)
const NotificationBell = () => {
  // ... existing state and functions

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 380, maxHeight: 500, overflow: 'auto' } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>Mark all as read</Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary" sx={{ py: 2, width: '100%', textAlign: 'center' }}>
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 5).map((n) => ( // show only latest 5
            <MenuItem
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              sx={{
                borderLeft: `4px solid ${n.read ? '#e0e0e0' : getTypeColor(n.type)}`,
                backgroundColor: n.read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                py: 1.5,
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: n.read ? 'normal' : 'bold' }}>
                    {n.title}
                  </Typography>
                  {!n.read && <CircleIcon sx={{ color: '#2196f3', fontSize: 10 }} />}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  {n.message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Chip label={getTypeLabel(n.type)} size="small" variant="outlined" />
                  <Typography variant="caption" color="textSecondary">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))
        )}

        <Divider />
        <MenuItem onClick={() => { handleClose(); navigate('/notifications'); }} sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">View all notifications</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};
