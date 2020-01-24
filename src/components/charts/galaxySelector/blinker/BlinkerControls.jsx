import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../../site/button';
import Rewind from '../../../site/icons/Rewind';
import FastForward from '../../../site/icons/FastForward';
import Pause from '../../../site/icons/Pause';
import Play from '../../../site/icons/Play';
import { controls, control } from './blinker.module.scss';

const BlinkerControls = ({
  playing,
  handleStartStop,
  handleNext,
  handlePrevious,
}) => {
  const StartStopTag = playing ? Pause : Play;

  return (
    <div className={controls}>
      <Button
        className={control}
        icon
        iconEl={<Rewind />}
        onClick={handlePrevious}
      />
      <Button
        className={control}
        icon
        iconEl={<StartStopTag />}
        onClick={handleStartStop}
      />
      <Button
        className={control}
        icon
        iconEl={<FastForward />}
        onClick={handleNext}
      />
    </div>
  );
};

BlinkerControls.propTypes = {
  playing: PropTypes.bool,
  handleStartStop: PropTypes.func,
  handleNext: PropTypes.func,
  handlePrevious: PropTypes.func,
};

export default BlinkerControls;