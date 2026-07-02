import logging
import os
import sys

def setup_logger(output_dir=None):
    logger = logging.getLogger("PosterResizePro")
    logger.setLevel(logging.INFO)
    logger.propagate = False
        
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s', '%H:%M:%S')
    
    # Console handler. Mark it so FileHandler, which is also a StreamHandler,
    # does not get mistaken for the console stream on later setup calls.
    has_console = any(getattr(handler, "_poster_console", False) for handler in logger.handlers)
    if not has_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler._poster_console = True
        logger.addHandler(console_handler)
    
    # File handler if output_dir is provided
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        log_file = os.path.abspath(os.path.join(output_dir, "process.log"))
        try:
            has_same_file = any(
                getattr(handler, "_poster_log_file", None) == log_file
                for handler in logger.handlers
            )
            if not has_same_file:
                file_handler = logging.FileHandler(log_file, mode='w', encoding='utf-8')
                file_handler.setFormatter(formatter)
                file_handler._poster_log_file = log_file
                logger.addHandler(file_handler)
                logger.info(f"Log file initialized at {log_file}")
        except Exception as e:
            logger.error(f"Failed to initialize log file: {str(e)}")
            
    return logger

# Default logger instance
logger = logging.getLogger("PosterResizePro")
if not logger.handlers:
    setup_logger()
