import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import includes from 'lodash/includes';
import find from 'lodash/find';
import classnames from 'classnames';
import {
  select as d3Select,
  event as d3Event,
  clientPoint as d3ClientPoint,
  mouse as d3mouse,
} from 'd3-selection';
import { scaleLinear as d3ScaleLinear } from 'd3-scale';
import 'd3-transition';
import CircularProgress from 'react-md/lib//Progress/CircularProgress';
import { arrayify } from '../../../lib/utilities.js';
import Trendline from './Trendline.jsx';
import Points from './Points';
import XAxis from './XAxis.jsx';
import YAxis from './YAxis.jsx';
import Tooltip from '../shared/Tooltip.jsx';
import styles from './hubble-plot.module.scss';

class HubblePlot2D extends React.Component {
  constructor(props) {
    super(props);
    const { options } = props;
    const { domain } = options || {};

    this.state = {
      loading: true,
      userData: null,
      selectedData: null,
      hoveredData: null,
      tooltipPosX: 0,
      tooltipPosY: 0,
      showTooltip: false,
      xScale: d3ScaleLinear()
        .domain(domain ? domain[0] : props.xDomain)
        .range([props.padding, props.width]),
      yScale: d3ScaleLinear()
        .domain(domain ? domain[1] : props.yDomain)
        .range([props.height - props.padding, 0]),
      hubbleConstant: null,
    };

    this.svgEl = React.createRef();
    this.svgContainer = React.createRef();
  }

  componentDidMount() {
    const { data } = this.props;
    if (data) {
      this.updateHubblePlot();
    }
  }

  componentDidUpdate(prevProps) {
    const { data, activeGalaxy } = this.props;
    const isNewData = prevProps.data !== data;
    const isNewActiveGalaxy = prevProps.activeGalaxy !== activeGalaxy;

    if (isNewData) {
      this.updateHubblePlot();
    }

    if (isNewActiveGalaxy) {
      this.updateSelectedData();
    }
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  updateSelectedData() {
    const { activeGalaxy, data } = this.props;
    const activeData = find(data, d => {
      return activeGalaxy.name === d.name;
    });

    this.setState(prevState => ({
      ...prevState,
      selectedData: activeData ? arrayify(activeData) : prevState.selectedData,
      tooltipPosX: 0,
      tooltipPosY: 0,
      showTooltip: false,
    }));
  }

  clearSelection() {
    this.setState(prevState => ({
      ...prevState,
      hoveredData: null,
      showTooltip: false,
      tooltipPosX: 0,
      tooltipPosY: 0,
      selectedData: null,
    }));
  }

  toggleSelection(d) {
    const { selectedData } = this.state;
    const pointPos = d3ClientPoint(this.svgContainer.current, d3Event);

    const newState = {
      tooltipPosX: pointPos[0],
      tooltipPosY: pointPos[1],
      showTooltip: true,
      selectedData: arrayify(d),
    };

    if (includes(selectedData, d)) {
      newState.selectedData = null;
      newState.showTooltip = false;
    }

    this.setState(
      prevState => ({
        ...prevState,
        ...newState,
      }),
      () => {
        const { selectionCallback } = this.props;
        const { selectedData: newData } = this.state;

        if (selectionCallback) {
          selectionCallback(newData);
        }
      }
    );
  }

  toggleUserPoint() {
    const { xScale, yScale } = this.state;
    const {
      xValueAccessor,
      yValueAccessor,
      activeGalaxy,
      userHubblePlotCallback,
      data,
      options,
    } = this.props;
    const { createUserHubblePlot } = options || {};
    const pointPos = d3mouse(this.svgEl.current);

    if (data) {
      const userData = [...data];
      let targetDatum = userData[userData.length - 1];
      const userDatum = find(userData, d => {
        return activeGalaxy.name === d.name;
      });

      const xVal = xScale.invert(pointPos[0]);
      const yVal = yScale.invert(pointPos[1]);

      if (userDatum) {
        targetDatum = userDatum;
        targetDatum[xValueAccessor] = xVal;
        targetDatum[yValueAccessor] = yVal;
      } else {
        const firstEmptyDatum = find(userData, d => {
          return d[xValueAccessor] === null;
        });
        targetDatum = firstEmptyDatum || targetDatum;
        targetDatum[xValueAccessor] = xVal;
        targetDatum[yValueAccessor] = yVal;
      }

      this.setState(
        prevState => ({
          ...prevState,
          hoveredData: null,
          showTooltip: false,
          selectedData: [targetDatum],
        }),
        () => {
          if (userHubblePlotCallback && createUserHubblePlot) {
            userHubblePlotCallback(createUserHubblePlot, userData);
          }
        }
      );
    } else {
      this.clearSelection();
    }
  }

  // mouseover/focus handler for point
  onMouseOver = d => {
    const pointPos = d3ClientPoint(this.svgContainer.current, d3Event);

    // add hover style on point and show tooltip
    this.setState(prevState => ({
      ...prevState,
      hoveredData: arrayify(d),
      tooltipPosX: pointPos[0],
      tooltipPosY: pointPos[1],
      showTooltip: true,
    }));
  };

  // mouseout/blur handler for point
  onMouseOut = () => {
    const { selectedData } = this.state;

    // remove hover style on point but don't hide tooltip
    this.setState(prevState => ({
      ...prevState,
      hoveredData: null,
      showTooltip: !!selectedData,
    }));
  };

  onTrendlineClick = () => {
    const { userTrendlineCallback, options } = this.props;
    const { userTrendline } = options || {};
    const { xScale, yScale } = this.state;
    const $hubblePlot = this.svgEl.current;
    const terminus = d3mouse($hubblePlot);
    const slope = yScale.invert(terminus[1]) / xScale.invert(terminus[0]);

    userTrendlineCallback(userTrendline, slope);
  };

  // add event listeners to Scatterplot and Points
  addEventListeners() {
    const { options } = this.props;
    const { preSelected, createUserHubblePlot, userTrendline } = options || {};
    const $hubblePlot = d3Select(this.svgEl.current);
    const $allPoints = d3Select(this.svgEl.current).selectAll('.data-point');

    if (!preSelected && userTrendline) {
      $hubblePlot.on('click', () => {
        const pointData = d3Select(d3Event.target).datum();

        if (pointData) {
          this.toggleSelection(pointData);
        } else {
          this.clearSelection();
        }
      });
    } else if (!preSelected && createUserHubblePlot) {
      $hubblePlot.on('click', () => {
        const pointData = d3Select(d3Event.target).datum();

        if (pointData) {
          this.toggleSelection(pointData);
        } else if (createUserHubblePlot) {
          this.toggleUserPoint();
        } else {
          this.clearSelection();
        }
      });
    } else if (preSelected) {
      $hubblePlot.on('click', () => {
        const pointData = d3Select(d3Event.target).datum();

        if (pointData) {
          this.toggleSelection(pointData);
        } else {
          this.clearSelection();
        }
      });
    }

    // add event listeners to points
    $allPoints
      .on('mouseover', this.onMouseOver)
      .on('mouseout', this.onMouseOut);
  }

  // add event listeners to Scatterplot and Points
  removeEventListeners() {
    const $hubblePlot = d3Select(this.svgEl.current);
    const $allPoints = d3Select(this.svgEl.current).selectAll('.data-point');
    $hubblePlot.on('click', null);

    $allPoints.on('mouseover', null).on('mouseout', null);
  }

  updatePoints() {
    const { data, preSelected, options } = this.props;
    const { loading } = this.state;
    const { multiple } = options || {};

    if (!data) {
      return;
    }

    const $hubblePlot = d3Select(this.svgEl.current);

    if (isEmpty(data) && preSelected && loading) {
      this.setState(prevState => ({
        ...prevState,
        loading: false,
      }));
    } else if (multiple) {
      data.forEach((set, i) => {
        $hubblePlot.selectAll(`.data-point.set-${i}`).data(set);
      });

      this.setState(prevState => ({
        ...prevState,
        loading: false,
      }));
    } else {
      $hubblePlot.selectAll('.data-point').data(data);

      this.setState(prevState => ({
        ...prevState,
        loading: false,
      }));
    }
  }

  // bind data to elements and add styles and attributes
  updateHubblePlot() {
    this.updatePoints();

    this.addEventListeners();
  }

  render() {
    const {
      data,
      width,
      height,
      padding,
      offsetTop,
      offsetRight,
      xValueAccessor,
      yValueAccessor,
      xAxisLabel,
      yAxisLabel,
      name,
      tooltipAccessors,
      tooltipLabels,
      hubbleConstant,
      options,
      trendlineInteractable,
    } = this.props;

    const {
      xScale,
      yScale,
      loading,
      selectedData,
      hoveredData,
      tooltipPosX,
      tooltipPosY,
      showTooltip,
    } = this.state;

    const { userTrendline, multiple } = options || {};
    const svgClasses = classnames('svg-chart', styles.hubblePlot, {
      loading,
      loaded: !loading,
    });
    const calcHeight = height - padding;

    return (
      <>
        <div
          ref={this.svgContainer}
          className={`svg-container ${styles.hubblePlotContainer}`}
        >
          {loading && (
            <CircularProgress
              id={`${name}-loader`}
              className="chart-loader"
              scale={3}
            />
          )}
          <Tooltip
            key="tooltip"
            data={selectedData || hoveredData}
            posX={tooltipPosX}
            posY={tooltipPosY}
            show={showTooltip}
            accessors={tooltipAccessors}
            labels={tooltipLabels}
          />
          <svg
            className={svgClasses}
            preserveAspectRatio="xMidYMid meet"
            viewBox={`0 0 ${width} ${height}`}
            ref={this.svgEl}
            style={{
              opacity: 0,
            }}
          >
            <defs>
              <clipPath id="clip">
                <rect
                  x={padding}
                  y={offsetTop}
                  width={width - padding - offsetRight}
                  height={calcHeight}
                />
              </clipPath>
            </defs>
            <XAxis
              label={xAxisLabel}
              height={height}
              width={width}
              padding={padding}
              offsetTop={offsetTop}
              offsetRight={offsetRight}
              scale={xScale}
            />
            <YAxis
              label={yAxisLabel}
              height={height}
              padding={padding}
              offsetTop={offsetTop}
              scale={yScale}
            />
            <g>
              {data &&
                multiple &&
                data.map((set, i) => {
                  const key = `galaxy-${i}`;

                  return (
                    <Points
                      key={key}
                      data={set}
                      {...{
                        xScale,
                        yScale,
                        xValueAccessor,
                        yValueAccessor,
                        selectedData,
                        hoveredData,
                        offsetTop,
                      }}
                      pointClasses={`set-${i} ${styles.galaxyPoint}`}
                    />
                  );
                })}
              {data && !multiple && (
                <Points
                  {...{
                    data,
                    xScale,
                    yScale,
                    xValueAccessor,
                    yValueAccessor,
                    selectedData,
                    hoveredData,
                    offsetTop,
                  }}
                  pointClasses={styles.galaxyPoint}
                />
              )}
            </g>
            {(userTrendline || hubbleConstant) && xScale && yScale && (
              <Trendline
                {...{ xScale, yScale, hubbleConstant }}
                captureAreaX={padding}
                captureAreaY={offsetTop}
                captureAreaWidth={width}
                captureAreaHeight={calcHeight}
                clickHandler={this.onTrendlineClick}
                isInteractable={trendlineInteractable}
              />
            )}
          </svg>
        </div>
      </>
    );
  }
}

HubblePlot2D.defaultProps = {
  width: 600,
  height: 600,
  padding: 70,
  offsetTop: 7,
  offsetRight: 0,
  xDomain: [0, 300],
  yDomain: [0, 18000],
  xValueAccessor: 'distance',
  yValueAccessor: 'velocity',
  xAxisLabel: 'Distance (Mpc)',
  yAxisLabel: 'Velocity (Km/s)',
  tooltipAccessors: ['name', 'distance', 'velocity'],
  tooltipLabels: ['Galaxy', 'Distance', 'Velocity'],
};

HubblePlot2D.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  padding: PropTypes.number,
  offsetTop: PropTypes.number,
  offsetRight: PropTypes.number,
  data: PropTypes.array,
  activeGalaxy: PropTypes.object,
  options: PropTypes.object,
  xValueAccessor: PropTypes.string,
  yValueAccessor: PropTypes.string,
  tooltipAccessors: PropTypes.array,
  tooltipLabels: PropTypes.array,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  xDomain: PropTypes.array,
  yDomain: PropTypes.array,
  preSelected: PropTypes.bool,
  hubbleConstant: PropTypes.number,
  name: PropTypes.string,
  selectionCallback: PropTypes.func,
  userHubblePlotCallback: PropTypes.func,
  userTrendlineCallback: PropTypes.func,
  trendlineInteractable: PropTypes.bool,
};

export default HubblePlot2D;
