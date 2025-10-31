import React from 'react';
import TogetherForward from './TogetherForward';
import { coupleData, roadmap, deepDiveData } from './SampleData';

const App = () => {
  return (
    <TogetherForward
      coupleData={coupleData}
      roadmap={roadmap}
      deepDiveData={deepDiveData}
    />
  );
};

export default App;
