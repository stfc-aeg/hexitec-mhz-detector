import React, {useState, createContext, useContext} from "react";
import type PropsWithChildren  from "react";
import {Container, Row, Col, Form, InputGroup, Button} from "react-bootstrap";
import {TitleCard} from "odin-react";

interface ConditionalWrapperProps<P extends PropsWithChildren> extends PropsWithChildren {
  /*Optional Prop, provide it with a react component to return the hidable component as a child of the specified component.*/
  as?: React.FC<P>;
}

export const UserLevelWrapper = <P extends PropsWithChildren>(props: ConditionalWrapperProps<P> & P
) => {
  const { as: Comp, children, ...rest } = props;
  const show = useContext(UserLevelContext);
  if (!show) return null;
  if (Comp) return <Comp {...rest as P}>{children}</Comp>;
  return children;
}


export const UserLevelContext = createContext(true);


export const ConditionalPage: React.FC = () => {

  const [showExtra, setShowExtra] = useState(true);

  return (
      <Container>
        <Row>
          <Col>
            <TitleCard title="Conditional">
              <Row>
                <Form>
                  <Form.Check type="switch" label="Show Extra"
                            onChange={() => setShowExtra(!showExtra)}
                            checked={showExtra}/>
                </Form>
              </Row>
              <Row>
                <Col>
                <InputGroup>
                <InputGroup.Text>Always Visible:</InputGroup.Text>
                <Form.Control/>
                <ConditionalWrapper>
                  <InputGroup.Text>Extra Input</InputGroup.Text>
                  <Button>Click Me</Button>
                </ConditionalWrapper>
                
                </InputGroup>
                </Col>
                <ConditionalWrapper as={Col} md="4">
                  <Button>Hidden Column Contents</Button>
                </ConditionalWrapper>
              </Row>
            </TitleCard>
          </Col>
        </Row>
      </Container>
)}

