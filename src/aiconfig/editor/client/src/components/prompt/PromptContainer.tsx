import PromptActionBar from "./PromptActionBar";
import PromptInputRenderer from "./prompt_input/PromptInputRenderer";
import PromptOutputsRenderer from "./prompt_outputs/PromptOutputsRenderer";
import { ClientPrompt } from "../../shared/types";
import { getPromptSchema } from "../../utils/promptUtils";
import { Flex, Card } from "@mantine/core";
import { PromptInput as AIConfigPromptInput, JSONObject } from "aiconfig";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import PromptOutputBar from "./PromptOutputBar";
import PromptName from "./PromptName";
import ModelSelector from "./ModelSelector";
import { DEBOUNCE_MS } from "../../utils/constants";
import { debounce } from "lodash";

type Props = {
  prompt: ClientPrompt;
  cancel?: (cancellationToken: string) => Promise<void>;
  getModels?: (search: string) => Promise<string[]>;
  onChangePromptInput: (
    promptId: string,
    newPromptInput: AIConfigPromptInput
  ) => void;
  onChangePromptName: (promptId: string, newName: string) => void;
  onRunPrompt(promptId: string): Promise<void>;
  onUpdateModel: (promptId: string, newModel?: string) => void;
  onUpdateModelSettings: (
    promptId: string,
    newModelSettings: JSONObject
  ) => void;
  onUpdateParameters: (
    promptId: string,
    newParameters: Record<string, unknown>
  ) => void;
  defaultConfigModelName?: string;
  isRunButtonDisabled?: boolean;
};

export const PROMPT_CONTAINER_HEIGHT_MAP = new Map<string, number>();

export default memo(function PromptContainer({
  prompt,
  cancel,
  getModels,
  onChangePromptInput,
  onChangePromptName,
  defaultConfigModelName,
  onRunPrompt,
  onUpdateModel,
  onUpdateModelSettings,
  onUpdateParameters,
  isRunButtonDisabled = false,
}: Props) {
  const promptId = prompt._ui.id;
  const onChangeInput = useCallback(
    (newInput: AIConfigPromptInput) => onChangePromptInput(promptId, newInput),
    [promptId, onChangePromptInput]
  );

  const onChangeName = useCallback(
    (newName: string) => onChangePromptName(promptId, newName),
    [promptId, onChangePromptName]
  );

  const updateModelSettings = useCallback(
    (newModelSettings: JSONObject) =>
      onUpdateModelSettings(promptId, newModelSettings),
    [promptId, onUpdateModelSettings]
  );

  const updateParameters = useCallback(
    (parameters: JSONObject) => onUpdateParameters(promptId, parameters),
    [promptId, onUpdateParameters]
  );

  const runPrompt = useCallback(
    async () => await onRunPrompt(promptId),
    [promptId, onRunPrompt]
  );

  const onCancelRun = useCallback(async () => {
    if (!cancel) {
      return;
    }
    if (prompt._ui.cancellationToken) {
      return await cancel(prompt._ui.cancellationToken);
    } else {
      // TODO: saqadri - Maybe surface an error to the user, or explicitly throw an error in this case.
      console.log(
        `Warning: No cancellation token found for prompt: ${prompt.name}`
      );
      return;
    }
  }, [prompt.name, prompt._ui.cancellationToken, cancel]);

  const updateModel = useCallback(
    (model?: string) => onUpdateModel(promptId, model),
    [promptId, onUpdateModel]
  );

  const cellInputOutputRef = useRef<HTMLDivElement | null>(null);
  const debouncedSetHeight = useMemo(
    () =>
      debounce((entries: ResizeObserverEntry[]) => {
        if (entries.length > 0) {
          const height = entries[0].target.getBoundingClientRect().height;
          PROMPT_CONTAINER_HEIGHT_MAP.set(promptId, height);
        }
      }, DEBOUNCE_MS),
    [promptId]
  );

  // Whenever the cell input/output container resizes, we want to track its height so that we can bound
  // the action bar contents (settings, parameters, etc.) to the height of the prompt input and
  // output container
  useEffect(() => {
    if (!cellInputOutputRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(debouncedSetHeight);
    resizeObserver.observe(cellInputOutputRef.current!);

    return () => resizeObserver.disconnect();
  }, [debouncedSetHeight]);

  // TODO: When adding support for custom PromptContainers, implement a PromptContainerRenderer which
  // will take in the promptId and callback and render the appropriate PromptContainer with new memoized
  // callback and not having to pass promptId down to PromptContainer

  const promptSchema = getPromptSchema(prompt, defaultConfigModelName);
  const inputSchema = promptSchema?.input;

  return (
    <Flex justify="space-between" w="100%">
      <Card withBorder className="cellStyle" ref={cellInputOutputRef}>
        <Flex direction="column">
          <Flex justify="space-between" mb="0.5em">
            <PromptName
              promptId={promptId}
              name={prompt.name}
              onUpdate={onChangeName}
            />
            <ModelSelector
              getModels={getModels}
              prompt={prompt}
              onSetModel={updateModel}
              defaultConfigModelName={defaultConfigModelName}
            />
          </Flex>
          <PromptInputRenderer
            input={prompt.input}
            schema={inputSchema}
            onChangeInput={onChangeInput}
            onCancelRun={onCancelRun}
            onRunPrompt={runPrompt}
            isRunning={prompt._ui.isRunning}
            isRunButtonDisabled={isRunButtonDisabled}
          />
          <PromptOutputBar />
          {prompt.outputs && <PromptOutputsRenderer outputs={prompt.outputs} />}
        </Flex>
      </Card>
      <div className="sidePanel">
        <PromptActionBar
          prompt={prompt}
          promptSchema={promptSchema}
          onUpdateModelSettings={updateModelSettings}
          onUpdateParameters={updateParameters}
        />
      </div>
    </Flex>
  );
});
