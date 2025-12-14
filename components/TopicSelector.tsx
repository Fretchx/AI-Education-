import React from 'react';
import { Topic } from '../types';

interface TopicSelectorProps {
  currentTopic: Topic;
  onTopicChange: (topic: Topic) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ currentTopic, onTopicChange }) => {
  return (
    <div className="relative inline-block w-full">
      <select
        value={currentTopic}
        onChange={(e) => onTopicChange(e.target.value as Topic)}
        className="
          block w-full appearance-none bg-slate-800 border border-slate-600 
          text-white py-2 px-4 pr-8 rounded-lg leading-tight 
          focus:outline-none focus:bg-slate-700 focus:border-primary
          text-sm font-medium transition-colors cursor-pointer
        "
      >
        {Object.values(Topic).map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  );
};

export default TopicSelector;
