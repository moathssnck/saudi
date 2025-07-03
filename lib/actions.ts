

export const playNotificationSound = () => {
    const audio=new Audio('/gd.wav')
    if (audio) {
      audio!.play().catch((error) => {
        console.error('Failed to play sound:', error);
      });
    }
  };
