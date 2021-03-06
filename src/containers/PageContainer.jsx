import React from 'react';
import reactn from 'reactn';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';
import { WithQAing } from './WithQAing';
import Page from '../components/page';
import TwoCol from '../components/page/TwoCol.jsx';
import PageNav from '../components/pageNav';
import SupernovaSelectorWithLightCurve from './SupernovaSelectorWithLightCurveContainer.jsx';
import GalaxyScrambler from './GalaxyScramblerContainer.jsx';
import GalaxySelector from './GalaxySelectorContainer.jsx';
import HubblePlot from './HubblePlot2DContainer.jsx';
import HubblePlot3D from './HubblePlot3DContainer.jsx';

@reactn
class PageContainer extends React.PureComponent {
  constructor(props) {
    super(props);

    this.layouts = {
      default: Page,
      TwoCol,
      SingleCol: Page,
    };

    this.widgetTags = {
      SupernovaSelectorWithLightCurve,
      GalaxyScrambler,
      GalaxySelector,
      HubblePlot,
      HubblePlot3D,
    };
  }

  componentDidMount() {
    const { data } = this.props;
    const { id } = data.allPagesJson.nodes[0];

    this.dispatch.updatePageId(id);
  }

  render() {
    const {
      data,
      answers,
      updateAnswer,
      activeAnswer,
      activeQuestionId,
      advanceActiveQuestion,
      setActiveQuestion,
    } = this.props;
    const {
      id,
      investigation,
      title,
      layout,
      previous,
      next,
      content,
      widgets,
      images,
      tables,
      questionsByPage: questions,
    } = data.allPagesJson.nodes[0];
    const Tag = this.layouts[layout || 'default'];
    const WidgetTags = widgets
      ? widgets.map(w => this.widgetTags[w.type])
      : null;

    return (
      <div className="container-page">
        <Tag
          {...{
            id,
            layout,
            title,
            previous,
            next,
            content,
            widgets,
            tables,
            images,
            questions,
            answers,
            updateAnswer,
            activeAnswer,
            advanceActiveQuestion,
            setActiveQuestion,
            activeQuestionId,
            WidgetTags,
          }}
        />
        <PageNav {...{ previous, next }} baseUrl={`/${investigation}`} />
      </div>
    );
  }
}

export default WithQAing(PageContainer);

PageContainer.propTypes = {
  data: PropTypes.object,
  answers: PropTypes.object,
  updateAnswer: PropTypes.func,
  activeAnswer: PropTypes.object,
  activeQuestionId: PropTypes.string,
  advanceActiveQuestion: PropTypes.func,
  setActiveQuestion: PropTypes.func,
};

export const query = graphql`
  query PageQuery($id: String!, $investigation: String) {
    allPagesJson(
      filter: { id: { eq: $id }, investigation: { eq: $investigation } }
    ) {
      nodes {
        id
        investigation
        layout
        slug
        title
        content
        next {
          title
          link
        }
        previous {
          title
          link
        }
        images {
          mediaPath
          altText
          layout {
            col
            row
          }
        }
        tables {
          id
          title
          position
          colTitles
          rowTitles
          rows {
            accessor
            id
            content
          }
        }
        widgets {
          type
          source
          layout {
            col
            row
          }
          options {
            showSelector
            showLightCurve
            createUserHubblePlot
            showUserHubblePlot
            hubbleConstant
            userTrendline
            lightCurveTemplates
            choosePeakMagnitude
            chooseLightCurveTemplate
            preSelectedLightCurveTemplate
            preSelectedLightCurveMagnitude
            toggleDataPointsVisibility
            autoplay
            preSelected
            multiple
            domain
          }
        }
        questionsByPage {
          question {
            id
            questionType
            compoundQuestion
            tool
            label
            labelPre
            labelPost
            srLabel
            answerPre
            answerPost
            answerAccessor
            placeholder
            options {
              label
              value
            }
          }
        }
      }
    }
  }
`;
