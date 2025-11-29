warning: 'border-yellow-500/30',
    danger: 'border-red-500/30',
    };

return (
    <motion.div
        className={`card ${glow ? 'card-glow' : ''} ${variantStyles[variant]} ${className}`}
        style={style}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: onClick ? 1.02 : 1 }}
        whileTap={{ scale: onClick ? 0.98 : 1 }}
    >
        {children}
    </motion.div>
);
}
