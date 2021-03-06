/* eslint-disable react/no-danger, react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import includes from 'lodash/includes';
import QAs from '../qas';
import { renderDef, capitalize } from '../../lib/utilities.js';
import ObservationsTables from '../charts/shared/observationsTables/ObservationsTables';
import Placeholder from '../placeholder';
import styles from './page.module.scss';
import ImageBlock from './shared/imageBlock';

class TwoCol extends React.PureComponent {
  filterTables(side, tables) {
    if (!tables) return null;

    return tables.filter(table => {
      const { position } = table;

      if (includes(position, side) || (side !== 'left' && !position)) {
        return table;
      }

      return null;
    });
  }

  renderWidget = (row, col) => {
    const {
      widgets,
      WidgetTags,
      questions,
      answers,
      updateAnswer,
      activeAnswer,
      advanceActiveQuestion,
      setActiveQuestion,
      activeQuestionId,
    } = this.props;
    if (!widgets) return null;
    return widgets.map((widget, i) => {
      const { layout, options } = widget;
      const { row: widgetRow, col: widgetCol } = layout || {};
      const COLUMN = col || 'right';
      const ROW = row || 'bottom';
      if (
        WidgetTags[i] &&
        COLUMN === (widgetCol || 'right') &&
        ROW === (widgetRow || 'bottom')
      ) {
        const WidgetTag = WidgetTags[i];
        const key = `${widgetRow}_${widgetCol}_${i}`;

        return (
          <div
            key={key}
            className={styles[`gridWidget${capitalize(widgetRow || 'bottom')}`]}
          >
            <WidgetTag
              {...{
                questions,
                answers,
                updateAnswer,
                activeAnswer,
                advanceActiveQuestion,
                setActiveQuestion,
                activeQuestionId,
                widget,
                options,
              }}
            />
          </div>
        );
      }
      return null;
    });
  };

  renderImages = (row, col) => {
    const { images } = this.props;
    const uRow = row || 'bottom';
    const uCol = col || 'right';
    const img =
      images &&
      images.map((image, i) => {
        const { layout } = image;
        const { row: iRow, col: iCol } = layout || {};
        const COL = iCol || 'right';
        const ROW = iRow || 'bottom';
        return (
          uCol === COL &&
          uRow === ROW && (
            <ImageBlock
              // eslint-disable-next-line react/no-array-index-key
              key={image.altText + i}
              {...{ image }}
              classname={styles[`gridImage${capitalize(ROW)}`]}
            />
          )
        );
      });
    return img;
  };

  render() {
    const { title, content, questions, answers, tables } = this.props;

    const leftColTables = this.filterTables('left', tables);
    const rightColTables = this.filterTables('right', tables);

    const topLeftWidgets = this.renderWidget('top', 'left');
    const bottomLeftWidgets = this.renderWidget('bottom', 'left');
    const topRightWidgets = this.renderWidget('top', 'right');
    const bottomRightWidgets = this.renderWidget('bottom', 'right');
    const rightColWidgets = topRightWidgets || bottomRightWidgets;

    const imageLeftTop = this.renderImages('top', 'left');
    const imageLeftBottom = this.renderImages('bottom', 'left');
    const imageRightTop = this.renderImages('top', 'right');
    const imageRightBottom = this.renderImages('bottom', 'right');
    const rightColImages = imageRightTop || imageRightBottom;

    return (
      <div className="container-flex spaced">
        <div className="col padded col-width-50">
          <div className={styles.leftColGrid}>
            <h1 className={`space-bottom section-title ${styles.gridTitle}`}>
              {title}
            </h1>
            <div
              className={styles.gridCopy}
              dangerouslySetInnerHTML={renderDef(content)}
            />
            {imageLeftTop}
            {topLeftWidgets}
            {leftColTables && (
              <ObservationsTables answers={answers} tables={leftColTables} />
            )}
            {questions && (
              <div className={styles.gridQas}>
                <QAs {...this.props} />
              </div>
            )}
            {imageLeftBottom}
            {bottomLeftWidgets}
          </div>
        </div>
        <div
          className={`col padded col-width-50 col-fixed ${styles.rightColGrid}`}
        >
          {imageRightTop}
          {topRightWidgets}
          {rightColTables && (
            <ObservationsTables answers={answers} tables={rightColTables} />
          )}
          {imageRightBottom}
          {bottomRightWidgets}
          {!rightColWidgets && !rightColTables && !rightColImages && (
            <div className={styles.gridPlaceholder}>
              <Placeholder />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TwoCol;

TwoCol.propTypes = {
  title: PropTypes.string,
  content: PropTypes.string,
  WidgetTags: PropTypes.array,
  widgets: PropTypes.array,
  images: PropTypes.array,
  options: PropTypes.object,
  questions: PropTypes.array,
  answers: PropTypes.object,
  tables: PropTypes.array,
  activeId: PropTypes.string,
  updateAnswer: PropTypes.func,
  activeAnswer: PropTypes.object,
  activeQuestionId: PropTypes.string,
  advanceActiveQuestion: PropTypes.func,
  setActiveQuestion: PropTypes.func,
};
