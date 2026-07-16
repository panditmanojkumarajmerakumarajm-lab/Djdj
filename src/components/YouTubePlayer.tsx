import React from 'react';
import { motion } from 'motion/react';
import { X, Calendar, User, Sparkles } from 'lucide-react';
import { PortfolioVideo } from '../types';

interface YouTubePlayerProps {
  video: PortfolioVideo | null;
  onClose: () => void;
}

export default function YouTubePlayer({ video, onClose }: YouTubePlayerProps) {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-2xl">
      {/* Immersive Cinema Full-Screen Iframe Wrapper */}
      <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4 z-10">
        <div className="w-full h-full md:max-w-6xl md:max-h-[85vh] aspect-video bg-neutral-950 shadow-2xl relative border-0 md:border md:border-neutral-800 md:rounded-2xl overflow-hidden">
          <iframe 
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </div>

      {/* Top Floating Controls */}
      <div className="relative z-20 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 mb-1.5 pointer-events-auto">
          <span className="text-[10px] px-2.5 py-1 bg-red-600 text-white font-mono font-bold uppercase rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Playing Showreel
          </span>
          <span className="text-xs font-mono text-neutral-300 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800">{video.duration} Mins</span>
        </div>

        <button 
          onClick={onClose}
          className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 pointer-events-auto"
          title="Close Player"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom overlay with details */}
      <div className="relative z-20 w-full p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 text-white">
        <div className="max-w-6xl mx-auto space-y-3">
          <h3 className="font-display font-black text-xl md:text-2xl text-white tracking-tight leading-snug">
            {video.title}
          </h3>

          <div className="flex flex-wrap gap-4 text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-red-500" />
              <span>Channel: <strong className="text-white">{video.channelName}</strong></span>
            </div>
            {video.publishDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-500" />
                <span>Uploaded: <strong className="text-white">{video.publishDate}</strong></span>
              </div>
            )}
          </div>

          {video.description && (
            <p className="text-xs text-neutral-300 leading-relaxed max-w-4xl max-h-16 overflow-y-auto bg-neutral-950/60 p-3 rounded-lg border border-neutral-900">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
