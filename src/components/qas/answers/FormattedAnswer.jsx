/* eslint-disable react/no-danger */

import React from 'react';
import PropTypes from 'prop-types';
import includes from 'lodash/includes';
import StellarValue from '../../charts/shared/StellarValue';
import StellarValueRange from '../../charts/shared/StellarValueRange';
import { renderDef } from '../../../lib/utilities.js';

class FormattedAnswer extends React.PureComponent {
  render() {
    const { pre, post, type, body } = this.props;

    return (
      <>
        {pre && (
          <span
            className="answer-pre"
            dangerouslySetInnerHTML={renderDef(pre)}
          />
        )}
        {includes(type, 'range') ? (
          <span className="answer-content">
            <StellarValueRange type={type.split(' range')[0]} data={body} />
          </span>
        ) : (
          <span className="answer-content">
            <StellarValue type={type} value={body} />
          </span>
        )}
        {post && (
          <span
            className="answer-post"
            dangerouslySetInnerHTML={renderDef(post)}
          />
        )}
      </>
    );
  }
}

FormattedAnswer.propTypes = {
  type: PropTypes.string,
  pre: PropTypes.string,
  body: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  post: PropTypes.string,
};

export default FormattedAnswer;
