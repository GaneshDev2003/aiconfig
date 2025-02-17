import { Accordion, Text } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo, useState } from "react";
import ParametersRenderer from "./ParametersRenderer";

type Props = {
  initialValue: JSONObject;
  onUpdateParameters: (newParameters: JSONObject) => void;
};

export default memo(function GlobalParametersContainer({
  initialValue,
  onUpdateParameters,
}: Props) {
  const [isParametersDrawerOpen, setIsParametersDrawerOpen] = useState(false);

  return (
    <div className="parametersContainer">
      <Accordion
        styles={{
          item: { borderBottom: 0 },
          label: {
            textAlign: "center",
            paddingTop: "0.5em",
            paddingBottom: "0.5em",
            fontSize: "0.85em",
          },
        }}
        onChange={(value) => setIsParametersDrawerOpen(value === "parameters")}
      >
        <Accordion.Item value="parameters">
          <Accordion.Control>
            <Text color="blue">Global Parameters {"{}"}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            {isParametersDrawerOpen && (
              <ParametersRenderer
                initialValue={initialValue}
                onUpdateParameters={onUpdateParameters}
                maxHeight="300px"
              />
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
});
